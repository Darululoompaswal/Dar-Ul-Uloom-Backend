const prisma = require("../../config/prisma");
const ApiError = require("../../utils/ApiError");
const { getPagination } = require("../../utils/pagination");

const visitInclude = {
  student: {
    select: {
      id: true,
      fullNameEn: true,
      fullNameUr: true,
      registrationNumber: true
    }
  },
  teacher: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      employeeNumber: true
    }
  }
};

function mapPrismaError(error) {
  if (error?.code === "P2003") {
    return new ApiError(422, "Linked student or teacher does not exist");
  }
  return error;
}

/** Local calendar day start (inclusive) for date-range filters. */
function dayStart(value) {
  const date = value instanceof Date ? value : new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Start of the day after `value` (exclusive upper bound). */
function dayAfter(value) {
  const start = dayStart(value);
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
}

async function create(data) {
  try {
    return await prisma.visit.create({
      data,
      include: visitInclude
    });
  } catch (error) {
    throw mapPrismaError(error);
  }
}

async function list(query) {
  const { page, limit, skip } = getPagination(query);
  const search = query.search?.trim();

  const where = {
    ...(query.studentId ? { studentId: query.studentId } : {}),
    ...(query.teacherId ? { teacherId: query.teacherId } : {}),
    ...(query.from || query.to
      ? {
          visitDate: {
            ...(query.from ? { gte: dayStart(query.from) } : {}),
            ...(query.to ? { lt: dayAfter(query.to) } : {})
          }
        }
      : {}),
    ...(search
      ? {
          OR: [
            { visitorName: { contains: search, mode: "insensitive" } },
            { visitorRelation: { contains: search, mode: "insensitive" } },
            { visitorCnic: { contains: search, mode: "insensitive" } },
            { visitorPhone: { contains: search, mode: "insensitive" } },
            { reason: { contains: search, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const [data, total] = await Promise.all([
    prisma.visit.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ visitDate: "desc" }, { createdAt: "desc" }],
      include: visitInclude
    }),
    prisma.visit.count({ where })
  ]);

  return { data, total, page, limit };
}

async function getById(id) {
  const visit = await prisma.visit.findUnique({
    where: { id },
    include: visitInclude
  });

  if (!visit) throw new ApiError(404, "Visit not found");
  return visit;
}

async function stats() {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [total, today, thisMonth, currentlyInside] = await Promise.all([
    prisma.visit.count(),
    prisma.visit.count({ where: { visitDate: { gte: dayStart, lt: nextDay } } }),
    prisma.visit.count({ where: { visitDate: { gte: monthStart, lt: nextMonth } } }),
    prisma.visit.count({
      where: {
        checkInTime: { not: null },
        checkOutTime: null
      }
    })
  ]);

  return { total, today, thisMonth, currentlyInside };
}

async function update(id, data) {
  await getById(id);

  try {
    return await prisma.visit.update({
      where: { id },
      data,
      include: visitInclude
    });
  } catch (error) {
    throw mapPrismaError(error);
  }
}

async function remove(id) {
  await getById(id);
  await prisma.visit.delete({ where: { id } });
  return { id };
}

module.exports = { create, list, getById, stats, update, remove };
