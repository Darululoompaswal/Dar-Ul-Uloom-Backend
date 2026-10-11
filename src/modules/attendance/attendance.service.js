const prisma = require("../../config/prisma");
const ApiError = require("../../utils/ApiError");
const { getPagination, paginatedResponse } = require("../../utils/pagination");

const STATUS_MAP = {
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  LATE: "LATE",
  LEAVE: "LEAVE",
  EXCUSED: "LEAVE"
};

function toDateOnly(value) {
  const date = value instanceof Date ? value : new Date(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function formatDateOnly(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

function serializeSession(session) {
  return {
    id: session.id,
    departmentId: session.departmentId,
    classId: session.classId,
    date: formatDateOnly(session.date),
    sessionType: session.sessionType,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    records: (session.records ?? []).map((record) => ({
      id: record.id,
      studentId: record.studentId,
      status: record.status === "LEAVE" ? "EXCUSED" : record.status,
      remarks: record.remarks,
      version: record.version,
      updatedAt: record.updatedAt.toISOString()
    }))
  };
}

async function upsertSession({ departmentId, classId, date, sessionType = "DAILY", entries = [] }) {
  if (!departmentId || !classId || !date) {
    throw new ApiError(422, "departmentId, classId and date are required");
  }

  const [department, classRow] = await Promise.all([
    prisma.department.findFirst({ where: { id: departmentId, deletedAt: null } }),
    prisma.class.findFirst({ where: { id: classId, deletedAt: null } })
  ]);
  if (!department) throw new ApiError(404, "Department not found");
  if (!classRow) throw new ApiError(404, "Class not found");

  const day = toDateOnly(date);

  const session = await prisma.$transaction(async (tx) => {
    const upserted = await tx.attendanceSession.upsert({
      where: {
        classId_date_sessionType: {
          classId,
          date: day,
          sessionType
        }
      },
      create: {
        departmentId,
        classId,
        date: day,
        sessionType
      },
      update: {
        departmentId,
        deletedAt: null
      }
    });

    for (const entry of entries) {
      const status = STATUS_MAP[entry.status];
      if (!status) continue;

      await tx.attendanceRecord.upsert({
        where: {
          attendanceSessionId_studentId: {
            attendanceSessionId: upserted.id,
            studentId: entry.studentId
          }
        },
        create: {
          attendanceSessionId: upserted.id,
          studentId: entry.studentId,
          status,
          remarks: entry.remarks ?? null,
          version: 1
        },
        update: {
          status,
          remarks: entry.remarks ?? null,
          deletedAt: null,
          version: { increment: 1 }
        }
      });
    }

    return tx.attendanceSession.findUnique({
      where: { id: upserted.id },
      include: { records: { where: { deletedAt: null } } }
    });
  });

  return serializeSession(session);
}

async function getSession({ classId, date, sessionType = "DAILY" }) {
  const day = toDateOnly(date);
  const session = await prisma.attendanceSession.findFirst({
    where: {
      classId,
      date: day,
      sessionType,
      deletedAt: null
    },
    include: { records: { where: { deletedAt: null } } }
  });

  if (!session) return null;
  return serializeSession(session);
}

async function listSessions(query) {
  const { page, limit, skip } = getPagination(query);
  const where = {
    deletedAt: null,
    ...(query.classId ? { classId: query.classId } : {}),
    ...(query.departmentId ? { departmentId: query.departmentId } : {}),
    ...(query.from || query.to
      ? {
          date: {
            ...(query.from ? { gte: toDateOnly(query.from) } : {}),
            ...(query.to ? { lte: toDateOnly(query.to) } : {})
          }
        }
      : {})
  };

  const [rows, total] = await Promise.all([
    prisma.attendanceSession.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: "desc" },
      include: { records: { where: { deletedAt: null } } }
    }),
    prisma.attendanceSession.count({ where })
  ]);

  return {
    data: rows.map(serializeSession),
    total,
    page,
    limit
  };
}

async function removeSession(id) {
  const existing = await prisma.attendanceSession.findFirst({
    where: { id, deletedAt: null }
  });
  if (!existing) throw new ApiError(404, "Attendance session not found");

  await prisma.$transaction([
    prisma.attendanceRecord.updateMany({
      where: { attendanceSessionId: id },
      data: { deletedAt: new Date(), version: { increment: 1 } }
    }),
    prisma.attendanceSession.update({
      where: { id },
      data: { deletedAt: new Date() }
    })
  ]);

  return { id };
}

module.exports = {
  upsertSession,
  getSession,
  listSessions,
  removeSession,
  paginatedResponse
};
