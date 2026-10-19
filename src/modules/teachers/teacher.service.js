const prisma = require("../../config/prisma");
const ApiError = require("../../utils/ApiError");
const { getPagination } = require("../../utils/pagination");

const teacherInclude = { departments: { include: { department: true } } };

function splitTeacherPayload(data) {
  const { departmentIds, ...teacher } = data;
  return { teacher, departmentIds: departmentIds && [...new Set(departmentIds)] };
}

// The shared error handler has no Prisma-specific branch, so constraint
// failures are translated to operational errors here.
function mapPrismaError(error) {
  if (error?.code === "P2002") return new ApiError(422, "Employee number is already in use");
  if (error?.code === "P2003") return new ApiError(422, "One or more departments do not exist");
  return error;
}

async function assertEmployeeNumberIsFree(employeeNumber, excludeId) {
  if (!employeeNumber) return;
  const existing = await prisma.teacher.findUnique({
    where: { employeeNumber },
    select: { id: true }
  });
  if (existing && existing.id !== excludeId) {
    throw new ApiError(422, "Employee number is already in use");
  }
}

async function create(data) {
  const { teacher, departmentIds = [] } = splitTeacherPayload(data);
  await assertEmployeeNumberIsFree(teacher.employeeNumber);

  try {
    return await prisma.$transaction(async (tx) => {
      const created = await tx.teacher.create({ data: teacher });

      if (departmentIds.length) {
        await tx.teacherDepartment.createMany({
          data: departmentIds.map((departmentId) => ({ teacherId: created.id, departmentId }))
        });
      }

      return tx.teacher.findUnique({
        where: { id: created.id },
        include: teacherInclude
      });
    });
  } catch (error) {
    throw mapPrismaError(error);
  }
}

async function list(query) {
  const { page, limit, skip } = getPagination(query);
  const search = query.search?.trim();

  const where = {
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.departmentId ? { departments: { some: { departmentId: query.departmentId } } } : {}),
    ...(search ? {
      OR: [
        { employeeNumber: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { fatherName: { contains: search, mode: "insensitive" } },
        { cnic: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { qualification: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } }
      ]
    } : {})
  };

  const [data, total] = await Promise.all([
    prisma.teacher.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: teacherInclude
    }),
    prisma.teacher.count({ where })
  ]);

  return { data, total, page, limit };
}

async function getById(id) {
  const teacher = await prisma.teacher.findFirst({
    where: { id, deletedAt: null },
    include: teacherInclude
  });

  if (!teacher) throw new ApiError(404, "Teacher not found");
  return teacher;
}

async function stats() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [total, active, departments, joinedThisMonth] = await Promise.all([
    prisma.teacher.count(),
    prisma.teacher.count({ where: { status: "ACTIVE" } }),
    prisma.department.findMany({
      where: { isActive: true },
      orderBy: { nameEn: "asc" },
      select: {
        id: true,
        code: true,
        nameEn: true,
        nameUr: true,
        _count: { select: { teacherDepartments: true } }
      }
    }),
    prisma.teacher.count({
      where: {
        OR: [
          { joiningDate: { gte: monthStart, lt: nextMonthStart } },
          {
            joiningDate: null,
            createdAt: { gte: monthStart, lt: nextMonthStart }
          }
        ]
      }
    })
  ]);

  return {
    total,
    active,
    inactive: total - active,
    byDepartment: departments.map((department) => ({
      departmentId: department.id,
      code: department.code,
      nameEn: department.nameEn,
      nameUr: department.nameUr,
      count: department._count.teacherDepartments
    })),
    joinedThisMonth
  };
}

async function update(id, data) {
  await getById(id);
  const { teacher, departmentIds } = splitTeacherPayload(data);
  await assertEmployeeNumberIsFree(teacher.employeeNumber, id);

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.teacher.update({
        where: { id },
        data: { ...teacher, version: { increment: 1 } }
      });

      if (departmentIds) {
        await tx.teacherDepartment.deleteMany({ where: { teacherId: id } });
        if (departmentIds.length) {
          await tx.teacherDepartment.createMany({
            data: departmentIds.map((departmentId) => ({ teacherId: id, departmentId }))
          });
        }
      }

      return tx.teacher.findUnique({ where: { id }, include: teacherInclude });
    });
  } catch (error) {
    throw mapPrismaError(error);
  }
}

async function remove(id) {
  await getById(id);

  await prisma.teacher.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      version: { increment: 1 }
    }
  });

  return { id };
}

function toDateOnly(value) {
  const date = value instanceof Date ? value : new Date(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function formatDateOnly(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

function serializeTeacherAttendance(row) {
  return {
    id: row.id,
    teacherId: row.teacherId,
    date: formatDateOnly(row.date),
    status: row.status,
    remarks: row.remarks ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

async function listAttendance(teacherId, query = {}) {
  await getById(teacherId);
  const from = query.from ? toDateOnly(query.from) : null;
  const to = query.to ? toDateOnly(query.to) : null;

  const rows = await prisma.teacherAttendance.findMany({
    where: {
      teacherId,
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {})
            }
          }
        : {})
    },
    orderBy: { date: "desc" }
  });

  return rows.map(serializeTeacherAttendance);
}

async function upsertAttendance(teacherId, data) {
  await getById(teacherId);
  const date = toDateOnly(data.date);

  const row = await prisma.teacherAttendance.upsert({
    where: {
      teacherId_date: { teacherId, date }
    },
    create: {
      teacherId,
      date,
      status: data.status,
      remarks: data.remarks ?? null
    },
    update: {
      status: data.status,
      remarks: data.remarks ?? null
    }
  });

  return serializeTeacherAttendance(row);
}

async function removeAttendance(teacherId, dateValue) {
  await getById(teacherId);
  const date = toDateOnly(dateValue);
  const existing = await prisma.teacherAttendance.findUnique({
    where: { teacherId_date: { teacherId, date } }
  });
  if (!existing) throw new ApiError(404, "Attendance record not found");
  await prisma.teacherAttendance.delete({ where: { id: existing.id } });
  return { id: existing.id };
}

module.exports = {
  create,
  list,
  getById,
  stats,
  update,
  remove,
  listAttendance,
  upsertAttendance,
  removeAttendance
};
