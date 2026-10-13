const prisma = require("../../config/prisma");
const ApiError = require("../../utils/ApiError");
const { getPagination } = require("../../utils/pagination");

function formatDateOnly(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

function toDateOnly(value) {
  const date = value instanceof Date ? value : new Date(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function serialize(row) {
  return {
    id: row.id,
    studentId: row.studentId ?? null,
    registrationNumber: row.registrationNumber ?? null,
    studentName: row.studentName,
    fatherName: row.fatherName ?? "",
    certificateNo: row.certificateNo,
    departmentId: row.departmentId,
    departmentName: row.departmentName,
    prizeWon: row.prizeWon,
    prizeType: row.prizeType,
    prizeTypeOther: row.prizeTypeOther ?? null,
    awardedDate: formatDateOnly(row.awardedDate),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function writeData(data) {
  return {
    studentId: data.studentId ?? null,
    registrationNumber: data.registrationNumber ?? null,
    studentName: data.studentName,
    fatherName: data.fatherName ?? "",
    certificateNo: data.certificateNo,
    departmentId: data.departmentId,
    departmentName: data.departmentName,
    prizeWon: data.prizeWon,
    prizeType: data.prizeType,
    prizeTypeOther: data.prizeType === "OTHER" ? data.prizeTypeOther ?? null : null,
    awardedDate: toDateOnly(data.awardedDate)
  };
}

async function list(query = {}) {
  const { page, limit, skip } = getPagination(query);
  const search = query.search?.trim();
  const where = {
    ...(query.departmentId ? { departmentId: query.departmentId } : {}),
    ...(query.prizeType ? { prizeType: query.prizeType } : {}),
    ...(query.from || query.to
      ? {
          awardedDate: {
            ...(query.from ? { gte: toDateOnly(query.from) } : {}),
            ...(query.to ? { lte: toDateOnly(query.to) } : {})
          }
        }
      : {}),
    ...(search
      ? {
          OR: [
            { studentName: { contains: search, mode: "insensitive" } },
            { fatherName: { contains: search, mode: "insensitive" } },
            { registrationNumber: { contains: search, mode: "insensitive" } },
            { certificateNo: { contains: search, mode: "insensitive" } },
            { departmentName: { contains: search, mode: "insensitive" } },
            { prizeWon: { contains: search, mode: "insensitive" } },
            { prizeType: { contains: search, mode: "insensitive" } },
            { prizeTypeOther: { contains: search, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const [rows, total] = await Promise.all([
    prisma.prizeAward.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ awardedDate: "desc" }, { createdAt: "desc" }]
    }),
    prisma.prizeAward.count({ where })
  ]);

  return { data: rows.map(serialize), total, page, limit };
}

async function getStats() {
  const rows = await prisma.prizeAward.findMany();
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const typeCounts = new Map();
  const departmentCounts = new Map();
  let thisMonth = 0;

  for (const row of rows) {
    if (row.awardedDate >= monthStart) thisMonth += 1;
    typeCounts.set(row.prizeType, (typeCounts.get(row.prizeType) ?? 0) + 1);
    const existing = departmentCounts.get(row.departmentId);
    if (existing) {
      existing.count += 1;
    } else {
      departmentCounts.set(row.departmentId, {
        departmentName: row.departmentName,
        count: 1
      });
    }
  }

  return {
    total: rows.length,
    thisMonth,
    byType: [...typeCounts.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count),
    byDepartment: [...departmentCounts.entries()]
      .map(([departmentId, value]) => ({
        departmentId,
        departmentName: value.departmentName,
        count: value.count
      }))
      .sort((a, b) => b.count - a.count)
  };
}

async function getById(id) {
  const row = await prisma.prizeAward.findUnique({ where: { id } });
  if (!row) throw new ApiError(404, "Prize not found");
  return serialize(row);
}

async function create(data) {
  const row = await prisma.prizeAward.create({ data: writeData(data) });
  return serialize(row);
}

async function update(id, data) {
  const existing = await prisma.prizeAward.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Prize not found");

  const prizeType = data.prizeType ?? existing.prizeType;
  const row = await prisma.prizeAward.update({
    where: { id },
    data: {
      ...(data.studentId !== undefined ? { studentId: data.studentId ?? null } : {}),
      ...(data.registrationNumber !== undefined
        ? { registrationNumber: data.registrationNumber ?? null }
        : {}),
      ...(data.studentName !== undefined ? { studentName: data.studentName } : {}),
      ...(data.fatherName !== undefined ? { fatherName: data.fatherName } : {}),
      ...(data.certificateNo !== undefined ? { certificateNo: data.certificateNo } : {}),
      ...(data.departmentId !== undefined ? { departmentId: data.departmentId } : {}),
      ...(data.departmentName !== undefined ? { departmentName: data.departmentName } : {}),
      ...(data.prizeWon !== undefined ? { prizeWon: data.prizeWon } : {}),
      ...(data.prizeType !== undefined ? { prizeType: data.prizeType } : {}),
      prizeTypeOther:
        prizeType === "OTHER"
          ? data.prizeTypeOther !== undefined
            ? data.prizeTypeOther ?? null
            : existing.prizeTypeOther
          : null,
      ...(data.awardedDate !== undefined ? { awardedDate: toDateOnly(data.awardedDate) } : {})
    }
  });
  return serialize(row);
}

async function remove(id) {
  const existing = await prisma.prizeAward.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Prize not found");
  await prisma.prizeAward.delete({ where: { id } });
  return { id };
}

module.exports = { list, getStats, getById, create, update, remove };
