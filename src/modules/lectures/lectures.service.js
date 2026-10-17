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

/** "HH:MM" or "HH:MM:SS" → minutes from midnight. */
function timeToMinutes(value) {
  if (!value || typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function timesOverlap(startA, endA, startB, endB) {
  const a0 = timeToMinutes(startA);
  const a1 = timeToMinutes(endA);
  const b0 = timeToMinutes(startB);
  const b1 = timeToMinutes(endB);
  if (a0 == null || a1 == null || b0 == null || b1 == null) return false;
  return a0 < b1 && b0 < a1;
}

/**
 * Days conflict when both are set and equal, or either day is unknown (null).
 * Unknown day is treated as a clash if times overlap — forms often omit dayOfWeek.
 */
function daysConflict(dayA, dayB) {
  if (dayA == null || dayB == null) return true;
  return Number(dayA) === Number(dayB);
}

async function assertClass(classId) {
  const row = await prisma.class.findFirst({ where: { id: classId, deletedAt: null } });
  if (!row) throw new ApiError(404, "Class not found");
  return row;
}

async function assertNoTeacherConflict({
  teacherId,
  dayOfWeek,
  startTime,
  endTime,
  excludeLectureId = null
}) {
  if (!teacherId || !startTime || !endTime) return;

  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);
  if (startMins == null || endMins == null) {
    throw new ApiError(422, "Invalid lecture start or end time");
  }
  if (endMins <= startMins) {
    throw new ApiError(422, "Lecture end time must be after start time");
  }

  const candidates = await prisma.classLecture.findMany({
    where: {
      teacherId,
      isActive: true,
      startTime: { not: null },
      endTime: { not: null },
      ...(excludeLectureId ? { id: { not: excludeLectureId } } : {})
    },
    include: {
      class: { select: { nameEn: true, code: true } }
    }
  });

  const clash = candidates.find(
    (row) =>
      daysConflict(dayOfWeek, row.dayOfWeek) &&
      timesOverlap(startTime, endTime, row.startTime, row.endTime)
  );

  if (clash) {
    const classLabel = clash.class?.code || clash.class?.nameEn || clash.classId;
    const dayPart =
      clash.dayOfWeek == null ? "" : ` on day ${clash.dayOfWeek}`;
    throw new ApiError(
      409,
      `Teacher is already assigned to ${clash.subjectName} (${classLabel}) ${clash.startTime}–${clash.endTime}${dayPart}`
    );
  }
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
  const teacherId = data.teacherId ?? null;
  const dayOfWeek = data.dayOfWeek ?? null;
  const startTime = data.startTime ?? null;
  const endTime = data.endTime ?? null;

  await assertNoTeacherConflict({ teacherId, dayOfWeek, startTime, endTime });

  const row = await prisma.classLecture.create({
    data: {
      classId,
      subjectName,
      teacherId,
      teacherName: data.teacherName ?? null,
      dayOfWeek,
      startTime,
      endTime,
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

  const teacherId =
    data.teacherId !== undefined ? data.teacherId ?? null : existing.teacherId;
  const dayOfWeek =
    data.dayOfWeek !== undefined ? data.dayOfWeek : existing.dayOfWeek;
  const startTime =
    data.startTime !== undefined ? data.startTime ?? null : existing.startTime;
  const endTime =
    data.endTime !== undefined ? data.endTime ?? null : existing.endTime;

  await assertNoTeacherConflict({
    teacherId,
    dayOfWeek,
    startTime,
    endTime,
    excludeLectureId: id
  });

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

module.exports = {
  listByClass,
  listAll,
  create,
  update,
  remove,
  timesOverlap,
  daysConflict,
  timeToMinutes,
  assertNoTeacherConflict
};
