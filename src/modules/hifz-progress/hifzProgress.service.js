const { randomUUID } = require("crypto");
const prisma = require("../../config/prisma");
const ApiError = require("../../utils/ApiError");

function formatDateOnly(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

function toDateOnly(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function serializeRow(row) {
  return {
    id: row.id,
    date: formatDateOnly(row.date),
    dayLabel: row.dayLabel ?? "",
    sabaqPara: row.sabaqPara ?? "",
    sabaqLines: row.sabaqLines ?? "",
    sabaqPukhtagi: row.sabaqPukhtagi ?? "",
    sabqiPara: row.sabqiPara ?? "",
    ghalti: row.ghalti ?? "",
    atkan: row.atkan ?? "",
    sabqiPukhtagi: row.sabqiPukhtagi ?? "",
    sami: row.sami ?? ""
  };
}

function serializeSheet(sheet) {
  return {
    id: sheet.id,
    classId: sheet.classId,
    className: sheet.className,
    studentId: sheet.studentId,
    studentName: sheet.studentName,
    fatherName: sheet.fatherName ?? "",
    rows: (sheet.rows ?? [])
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(serializeRow),
    createdAt: sheet.createdAt.toISOString(),
    updatedAt: sheet.updatedAt.toISOString()
  };
}

function mapRows(rows = []) {
  return rows.map((row, index) => ({
    id: row.id && String(row.id).length > 0 ? String(row.id) : randomUUID(),
    date: row.date ? toDateOnly(row.date) : null,
    dayLabel: row.dayLabel ?? "",
    sabaqPara: row.sabaqPara ?? "",
    sabaqLines: row.sabaqLines ?? "",
    sabaqPukhtagi: row.sabaqPukhtagi ?? "",
    sabqiPara: row.sabqiPara ?? "",
    ghalti: row.ghalti ?? "",
    atkan: row.atkan ?? "",
    sabqiPukhtagi: row.sabqiPukhtagi ?? "",
    sami: row.sami ?? "",
    sortOrder: index
  }));
}

async function list(query = {}) {
  const where = {
    ...(query.classId ? { classId: query.classId } : {}),
    ...(query.studentId ? { studentId: query.studentId } : {})
  };
  const rows = await prisma.hifzProgressSheet.findMany({
    where,
    include: { rows: true },
    orderBy: { updatedAt: "desc" }
  });
  return rows.map(serializeSheet);
}

async function getById(id) {
  const sheet = await prisma.hifzProgressSheet.findUnique({
    where: { id },
    include: { rows: true }
  });
  if (!sheet) throw new ApiError(404, "Hifz progress sheet not found");
  return serializeSheet(sheet);
}

async function create(data) {
  const existing = await prisma.hifzProgressSheet.findUnique({
    where: {
      classId_studentId: {
        classId: data.classId,
        studentId: data.studentId
      }
    }
  });
  if (existing) {
    throw new ApiError(409, "Hifz progress sheet already exists for this student/class");
  }

  const sheet = await prisma.hifzProgressSheet.create({
    data: {
      classId: data.classId,
      className: data.className,
      studentId: data.studentId,
      studentName: data.studentName,
      fatherName: data.fatherName ?? "",
      rows: { create: mapRows(data.rows) }
    },
    include: { rows: true }
  });
  return serializeSheet(sheet);
}

async function update(id, data) {
  const existing = await prisma.hifzProgressSheet.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Hifz progress sheet not found");

  const sheet = await prisma.$transaction(async (tx) => {
    if (Array.isArray(data.rows)) {
      await tx.hifzProgressRow.deleteMany({ where: { sheetId: id } });
    }

    return tx.hifzProgressSheet.update({
      where: { id },
      data: {
        ...(data.classId !== undefined ? { classId: data.classId } : {}),
        ...(data.className !== undefined ? { className: data.className } : {}),
        ...(data.studentId !== undefined ? { studentId: data.studentId } : {}),
        ...(data.studentName !== undefined ? { studentName: data.studentName } : {}),
        ...(data.fatherName !== undefined ? { fatherName: data.fatherName } : {}),
        ...(Array.isArray(data.rows) ? { rows: { create: mapRows(data.rows) } } : {})
      },
      include: { rows: true }
    });
  });

  return serializeSheet(sheet);
}

async function remove(id) {
  const existing = await prisma.hifzProgressSheet.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Hifz progress sheet not found");
  await prisma.hifzProgressSheet.delete({ where: { id } });
  return { id };
}

module.exports = { list, getById, create, update, remove };
