const fs = require("fs/promises");
const path = require("path");
const prisma = require("../../config/prisma");
const ApiError = require("../../utils/ApiError");
const { getPagination } = require("../../utils/pagination");
const { UPLOAD_ROOT } = require("../uploads/upload.middleware");

const UPLOAD_URL_PREFIX = "/uploads/";
const UPLOAD_BASE = path.resolve(UPLOAD_ROOT);

function splitStudentPayload(data) {
  const { guardians, admission, documents, ...student } = data;
  return { student, guardians, admission, documents };
}

async function create(data) {
  const { student, guardians = [], admission, documents = [] } = splitStudentPayload(data);

  return prisma.$transaction(async (tx) => {
    const created = await tx.student.create({ data: student });

    if (guardians.length) {
      await tx.guardian.createMany({
        data: guardians.map((guardian) => ({
          ...guardian,
          studentId: created.id
        }))
      });
    }

    await tx.studentAdmission.create({
      data: {
        ...admission,
        studentId: created.id
      }
    });

    if (documents.length) {
      await tx.studentDocument.createMany({
        data: documents.map((document) => ({
          ...document,
          studentId: created.id
        }))
      });
    }

    return tx.student.findUnique({
      where: { id: created.id },
      include: {
        guardians: true,
        admissions: {
          include: {
            department: true,
            class: true,
            academicYear: true
          }
        },
        documents: true
      }
    });
  });
}

async function list(query) {
  const { page, limit, skip } = getPagination(query);
  const search = query.search?.trim();
  const status = query.status?.trim();
  const departmentId = query.departmentId?.trim();
  const classId = query.classId?.trim();
  const academicYearId = query.academicYearId?.trim();
  const admissionStatus = query.admissionStatus?.trim();
  const unassignedClass = query.unassignedClass === "true";

  const where = { deletedAt: null };

  if (search) {
    where.OR = [
      { registrationNumber: { contains: search, mode: "insensitive" } },
      { fullNameEn: { contains: search, mode: "insensitive" } },
      { fullNameUr: { contains: search } },
      { fatherNameEn: { contains: search, mode: "insensitive" } },
      { fatherNameUr: { contains: search } },
      { admissions: { some: { admissionNumber: { contains: search, mode: "insensitive" } } } }
    ];
  }

  if (status) {
    where.status = status;
  }

  if (departmentId || classId || academicYearId || admissionStatus || unassignedClass) {
    where.admissions = {
      some: {
        ...(admissionStatus ? { status: admissionStatus } : { status: "ACTIVE" }),
        ...(departmentId ? { departmentId } : {}),
        ...(classId ? { classId } : {}),
        ...(academicYearId ? { academicYearId } : {}),
        ...(unassignedClass ? { classId: null } : {})
      }
    };
  }

  const [data, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        admissions: {
          where: { status: "ACTIVE" },
          include: { department: true, class: true, academicYear: true }
        }
      }
    }),
    prisma.student.count({ where })
  ]);

  return { data, total, page, limit };
}

async function getById(id) {
  const student = await prisma.student.findFirst({
    where: { id, deletedAt: null },
    include: {
      guardians: true,
      admissions: {
        include: {
          department: true,
          class: true,
          academicYear: true
        },
        orderBy: { createdAt: "desc" }
      },
      documents: true,
      enrollments: {
        include: {
          department: true,
          class: true,
          academicYear: true
        }
      },
      statusHistory: { orderBy: { effectiveDate: "desc" } }
    }
  });

  if (!student) throw new ApiError(404, "Student not found");
  return student;
}

async function update(id, data) {
  const existing = await getById(id);
  const { student, guardians, documents } = splitStudentPayload(data);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.student.update({
      where: { id },
      data: { ...student, version: { increment: 1 } }
    });

    if (guardians) {
      await tx.guardian.deleteMany({ where: { studentId: id } });
      if (guardians.length) {
        await tx.guardian.createMany({
          data: guardians.map((guardian) => ({ ...guardian, studentId: id }))
        });
      }
    }

    if (documents) {
      await tx.studentDocument.deleteMany({ where: { studentId: id } });
      if (documents.length) {
        await tx.studentDocument.createMany({
          data: documents.map((document) => ({ ...document, studentId: id }))
        });
      }
    }

    return tx.student.findUnique({
      where: { id: updated.id },
      include: {
        guardians: true,
        admissions: {
          include: { department: true, class: true, academicYear: true }
        },
        documents: true
      }
    });
  });
}

async function removeLocalUpload(fileUrl) {
  if (typeof fileUrl !== "string" || !fileUrl.startsWith(UPLOAD_URL_PREFIX)) return;

  const target = path.resolve(UPLOAD_BASE, fileUrl.slice(UPLOAD_URL_PREFIX.length));
  if (!target.startsWith(UPLOAD_BASE + path.sep)) return;

  await fs.unlink(target).catch(() => {});
}

async function remove(id) {
  const existing = await prisma.student.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, version: true }
  });

  if (!existing) throw new ApiError(404, "Student not found");

  await prisma.student.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      version: { increment: 1 }
    }
  });

  return { id: existing.id };
}

async function syncActiveEnrollment(tx, student, admission, classId) {
  const activeEnrollment = student.enrollments.find((entry) => entry.status === "ACTIVE");

  if (activeEnrollment) {
    if (classId) {
      await tx.studentEnrollment.update({
        where: { id: activeEnrollment.id },
        data: {
          classId,
          departmentId: admission.departmentId,
          academicYearId: admission.academicYearId
        }
      });
    } else {
      await tx.studentEnrollment.update({
        where: { id: activeEnrollment.id },
        data: { status: "TRANSFERRED", endDate: new Date() }
      });
    }
    return;
  }

  if (classId) {
    await tx.studentEnrollment.create({
      data: {
        studentId: student.id,
        classId,
        departmentId: admission.departmentId,
        academicYearId: admission.academicYearId,
        status: "ACTIVE"
      }
    });
  }
}

async function updateAdmissionPlacement(studentId, data) {
  const student = await getById(studentId);
  const activeAdmission =
    student.admissions.find((entry) => entry.status === "ACTIVE") ?? student.admissions[0];

  if (!activeAdmission) {
    throw new ApiError(400, "Student has no admission record");
  }

  const departmentId = data.departmentId ?? activeAdmission.departmentId;
  const academicYearId = data.academicYearId ?? activeAdmission.academicYearId;
  const classId = data.classId !== undefined ? data.classId : activeAdmission.classId;

  const [department, academicYear] = await Promise.all([
    prisma.department.findUnique({ where: { id: departmentId } }),
    prisma.academicYear.findUnique({ where: { id: academicYearId } })
  ]);

  if (!department) throw new ApiError(404, "Department not found");
  if (!academicYear) throw new ApiError(404, "Academic year not found");

  if (classId) {
    const targetClass = await prisma.class.findUnique({ where: { id: classId } });
    if (!targetClass) throw new ApiError(404, "Class not found");
    if (targetClass.departmentId !== departmentId) {
      throw new ApiError(400, "Class does not belong to the selected department");
    }
    if (targetClass.academicYearId !== academicYearId) {
      throw new ApiError(400, "Class does not belong to the selected academic year");
    }
  }

  await prisma.$transaction(async (tx) => {
    const updatedAdmission = await tx.studentAdmission.update({
      where: { id: activeAdmission.id },
      data: {
        departmentId,
        academicYearId,
        classId: classId ?? null
      }
    });

    student.admissions = student.admissions.map((entry) =>
      entry.id === updatedAdmission.id ? { ...entry, ...updatedAdmission } : entry
    );

    await syncActiveEnrollment(tx, student, updatedAdmission, classId ?? null);
  });

  return getById(studentId);
}

async function assignClass(studentId, { classId }) {
  const student = await getById(studentId);
  const activeAdmission =
    student.admissions.find((entry) => entry.status === "ACTIVE") ?? student.admissions[0];

  if (!activeAdmission) {
    throw new ApiError(400, "Student has no admission record");
  }

  if (classId) {
    const targetClass = await prisma.class.findUnique({ where: { id: classId } });
    if (!targetClass) {
      throw new ApiError(404, "Class not found");
    }
  }

  await prisma.$transaction(async (tx) => {
    const updatedAdmission = await tx.studentAdmission.update({
      where: { id: activeAdmission.id },
      data: { classId: classId ?? null }
    });

    await syncActiveEnrollment(tx, student, updatedAdmission, classId ?? null);
  });

  return getById(studentId);
}

module.exports = { create, list, getById, update, remove, assignClass, updateAdmissionPlacement };
