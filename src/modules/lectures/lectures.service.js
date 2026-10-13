const prisma = require("../../config/prisma");
const ApiError = require("../../utils/ApiError");

function serialize(row) {
  return {
    id: row.id,
    classId: row.classId,
    subject: row.subjectName,
    subjectName: row.subjectName,
    teacherId: row.teacherId ?? "",
    teacherName: row.teacherName ?? "",
    dayOfWeek: row.dayOfWeek ?? null,
    startTime: row.startTime ?? null,
    endTime: row.endTime ?? null,
    sortOrder: row.sortOrder ?? 0,
    isActive: row.isActive ?? true,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

async function assertClass(classId) {
  const row = await prisma.class.findFirst({ where: { id: classId, deletedAt: null } });
  if (!row) throw new ApiError(404, "Class not found");
  return row;
}

async function listByClass(classId) {
  await assertClass(classId);
  const rows = await prisma.classLecture.findMany({
    where: { classId, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { subjectName: "asc" }]
  });
  return rows.map(serialize);
}

async function listAll() {
  const rows = await prisma.classLecture.findMany({
    where: { isActive: true },
    orderBy: [{ classId: "asc" }, { sortOrder: "asc" }, { subjectName: "asc" }]
  });
  return rows.map(serialize);
}

async function create(classId, data) {
  await assertClass(classId);
  const subjectName = (data.subjectName ?? data.subject ?? "").trim();
  const row = await prisma.classLecture.create({
    data: {
      classId,
      subjectName,
      teacherId: data.teacherId ?? null,
      teacherName: data.teacherName ?? null,
      dayOfWeek: data.dayOfWeek ?? null,
      startTime: data.startTime ?? null,
      endTime: data.endTime ?? null,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true
    }
  });
  return serialize(row);
}

async function update(id, data) {
  const existing = await prisma.classLecture.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Lecture not found");

  const subjectName =
    data.subjectName !== undefined || data.subject !== undefined
      ? String(data.subjectName ?? data.subject).trim()
      : undefined;

  const row = await prisma.classLecture.update({
    where: { id },
    data: {
      ...(subjectName !== undefined ? { subjectName } : {}),
      ...(data.teacherId !== undefined ? { teacherId: data.teacherId ?? null } : {}),
      ...(data.teacherName !== undefined ? { teacherName: data.teacherName ?? null } : {}),
      ...(data.dayOfWeek !== undefined ? { dayOfWeek: data.dayOfWeek } : {}),
      ...(data.startTime !== undefined ? { startTime: data.startTime ?? null } : {}),
      ...(data.endTime !== undefined ? { endTime: data.endTime ?? null } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {})
    }
  });
  return serialize(row);
}

async function remove(id) {
  const existing = await prisma.classLecture.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Lecture not found");
  await prisma.classLecture.delete({ where: { id } });
  return { id };
}

module.exports = { listByClass, listAll, create, update, remove };
