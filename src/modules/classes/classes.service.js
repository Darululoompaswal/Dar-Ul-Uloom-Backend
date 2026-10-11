const prisma = require("../../config/prisma");
const ApiError = require("../../utils/ApiError");

const classSelect = {
  id: true,
  departmentId: true,
  academicYearId: true,
  nameEn: true,
  nameUr: true,
  code: true,
  capacity: true,
  classType: true,
  isActive: true,
  department: { select: { id: true, code: true, nameEn: true, nameUr: true } },
  academicYear: { select: { id: true, name: true, isCurrent: true } }
};

function list({ departmentId, academicYearId }) {
  return prisma.class.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      ...(departmentId ? { departmentId } : {}),
      ...(academicYearId ? { academicYearId } : {})
    },
    orderBy: [{ department: { nameEn: "asc" } }, { nameEn: "asc" }],
    select: classSelect
  });
}

async function create(data) {
  const { id, departmentId, academicYearId } = data;

  const [department, academicYear] = await Promise.all([
    prisma.department.findUnique({ where: { id: departmentId } }),
    prisma.academicYear.findUnique({ where: { id: academicYearId } })
  ]);

  if (!department) throw new ApiError(404, "Department not found");
  if (!academicYear) throw new ApiError(404, "Academic year not found");

  return prisma.class.create({
    data: {
      ...(id ? { id } : {}),
      departmentId,
      academicYearId,
      nameEn: data.nameEn,
      nameUr: data.nameUr ?? null,
      code: data.code ?? null,
      capacity: data.capacity ?? null,
      classType: data.classType ?? null,
      isActive: data.isActive ?? true
    },
    select: classSelect
  });
}

async function update(id, data) {
  const existing = await prisma.class.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Class not found");

  return prisma.class.update({
    where: { id },
    data: {
      ...(data.nameEn !== undefined ? { nameEn: data.nameEn } : {}),
      ...(data.nameUr !== undefined ? { nameUr: data.nameUr } : {}),
      ...(data.code !== undefined ? { code: data.code } : {}),
      ...(data.capacity !== undefined ? { capacity: data.capacity } : {}),
      ...(data.classType !== undefined ? { classType: data.classType } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {})
    },
    select: classSelect
  });
}

async function remove(id) {
  const existing = await prisma.class.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new ApiError(404, "Class not found");

  const activeAdmissions = await prisma.studentAdmission.count({
    where: { classId: id, status: "ACTIVE" }
  });
  if (activeAdmissions > 0) {
    throw new ApiError(409, "Cannot delete a class with active student admissions");
  }

  await prisma.class.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false }
  });
  return { id };
}

module.exports = { list, create, update, remove };
