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
    classId: row.classId,
    className: row.className,
    studentId: row.studentId,
    studentName: row.studentName,
    fatherName: row.fatherName ?? "",
    registrationNumber: row.registrationNumber ?? null,
    examName: row.examName,
    subject: row.subject,
    marksObtained: Number(row.marksObtained),
    marksMax: Number(row.marksMax),
    grade: row.grade,
    examDate: formatDateOnly(row.examDate),
    remarks: row.remarks ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function writeData(data) {
  return {
    classId: data.classId,
    className: data.className,
    studentId: data.studentId,
    studentName: data.studentName,
    fatherName: data.fatherName ?? "",
    registrationNumber: data.registrationNumber ?? null,
    examName: data.examName,
    subject: data.subject,
    marksObtained: data.marksObtained,
    marksMax: data.marksMax,
    grade: data.grade,
    examDate: toDateOnly(data.examDate),
    remarks: data.remarks ?? null
  };
}

async function list(query = {}) {
  const { page, limit, skip } = getPagination(query);
  const search = query.search?.trim();
  const where = {
    ...(query.classId ? { classId: query.classId } : {}),
    ...(query.examName ? { examName: query.examName } : {}),
    ...(search
      ? {
          OR: [
            { studentName: { contains: search, mode: "insensitive" } },
            { fatherName: { contains: search, mode: "insensitive" } },
            { registrationNumber: { contains: search, mode: "insensitive" } },
            { className: { contains: search, mode: "insensitive" } },
            { examName: { contains: search, mode: "insensitive" } },
            { subject: { contains: search, mode: "insensitive" } },
            { grade: { contains: search, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const [rows, total] = await Promise.all([
    prisma.examResult.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ examDate: "desc" }, { studentName: "asc" }, { subject: "asc" }]
    }),
    prisma.examResult.count({ where })
  ]);

  return { data: rows.map(serialize), total, page, limit };
}

async function listExamNames() {
  const rows = await prisma.examResult.findMany({
    select: { examName: true },
    distinct: ["examName"],
    orderBy: { examName: "asc" }
  });
  return rows.map((row) => row.examName).filter(Boolean);
}

async function getById(id) {
  const row = await prisma.examResult.findUnique({ where: { id } });
  if (!row) throw new ApiError(404, "Exam result not found");
  return serialize(row);
}

async function create(data) {
  const row = await prisma.examResult.create({ data: writeData(data) });
  return serialize(row);
}

async function update(id, data) {
  const existing = await prisma.examResult.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Exam result not found");

  const row = await prisma.examResult.update({
    where: { id },
    data: {
      ...(data.classId !== undefined ? { classId: data.classId } : {}),
      ...(data.className !== undefined ? { className: data.className } : {}),
      ...(data.studentId !== undefined ? { studentId: data.studentId } : {}),
      ...(data.studentName !== undefined ? { studentName: data.studentName } : {}),
      ...(data.fatherName !== undefined ? { fatherName: data.fatherName } : {}),
      ...(data.registrationNumber !== undefined
        ? { registrationNumber: data.registrationNumber ?? null }
        : {}),
      ...(data.examName !== undefined ? { examName: data.examName } : {}),
      ...(data.subject !== undefined ? { subject: data.subject } : {}),
      ...(data.marksObtained !== undefined ? { marksObtained: data.marksObtained } : {}),
      ...(data.marksMax !== undefined ? { marksMax: data.marksMax } : {}),
      ...(data.grade !== undefined ? { grade: data.grade } : {}),
      ...(data.examDate !== undefined ? { examDate: toDateOnly(data.examDate) } : {}),
      ...(data.remarks !== undefined ? { remarks: data.remarks ?? null } : {})
    }
  });
  return serialize(row);
}

async function remove(id) {
  const existing = await prisma.examResult.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Exam result not found");
  await prisma.examResult.delete({ where: { id } });
  return { id };
}

async function bulkUpsert(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "No results provided");
  }

  const rows = await prisma.$transaction(async (tx) => {
    const saved = [];
    for (const item of items) {
      const payload = writeData(item);
      const existing = await tx.examResult.findFirst({
        where: {
          classId: payload.classId,
          studentId: payload.studentId,
          examName: payload.examName,
          subject: payload.subject
        }
      });

      if (existing) {
        saved.push(
          await tx.examResult.update({
            where: { id: existing.id },
            data: payload
          })
        );
      } else {
        saved.push(await tx.examResult.create({ data: payload }));
      }
    }
    return saved;
  });

  return rows.map(serialize);
}

module.exports = { list, listExamNames, getById, create, update, remove, bulkUpsert };
