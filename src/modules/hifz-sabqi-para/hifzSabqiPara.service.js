const prisma = require("../../config/prisma");
const ApiError = require("../../utils/ApiError");

const PARA_COUNT = 30;

function emptyRow(paraNumber) {
  return {
    paraNumber,
    startDate: "",
    endDate: "",
    sabqiNama: "",
    ghalti: "",
    atkan: "",
    pukhtagi: ""
  };
}

function normalizeRows(rows) {
  const byPara = new Map();
  for (const entry of Array.isArray(rows) ? rows : []) {
    const paraNumber = Number(entry?.paraNumber);
    if (Number.isInteger(paraNumber) && paraNumber >= 1 && paraNumber <= PARA_COUNT) {
      byPara.set(paraNumber, {
        ...emptyRow(paraNumber),
        ...entry,
        paraNumber
      });
    }
  }
  return Array.from({ length: PARA_COUNT }, (_, index) => {
    const paraNumber = index + 1;
    return byPara.get(paraNumber) ?? emptyRow(paraNumber);
  });
}

function serialize(row) {
  return {
    id: row.id,
    classId: row.classId,
    className: row.className,
    studentId: row.studentId,
    studentName: row.studentName,
    fatherName: row.fatherName ?? "",
    teacherName: row.teacherName ?? "",
    monthLabel: row.monthLabel ?? "",
    correspondingDate: row.correspondingDate ?? "",
    absence: row.absence ?? "",
    illness: row.illness ?? "",
    leaveDays: row.leaveDays ?? "",
    holidays: row.holidays ?? "",
    totalDuration: row.totalDuration ?? "",
    remarks: row.remarks ?? "",
    rows: normalizeRows(row.rows),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

async function list(query = {}) {
  const where = {
    ...(query.classId ? { classId: query.classId } : {}),
    ...(query.studentId ? { studentId: query.studentId } : {})
  };
  const rows = await prisma.hifzSabqiParaSheet.findMany({
    where,
    orderBy: { updatedAt: "desc" }
  });
  return rows.map(serialize);
}

async function getById(id) {
  const row = await prisma.hifzSabqiParaSheet.findUnique({ where: { id } });
  if (!row) throw new ApiError(404, "Sabqi Para sheet not found");
  return serialize(row);
}

async function create(data) {
  const existing = await prisma.hifzSabqiParaSheet.findUnique({
    where: {
      classId_studentId: {
        classId: data.classId,
        studentId: data.studentId
      }
    }
  });
  if (existing) {
    throw new ApiError(409, "Sabqi Para sheet already exists for this student/class");
  }

  const row = await prisma.hifzSabqiParaSheet.create({
    data: {
      classId: data.classId,
      className: data.className,
      studentId: data.studentId,
      studentName: data.studentName,
      fatherName: data.fatherName ?? "",
      teacherName: data.teacherName ?? "",
      monthLabel: data.monthLabel ?? "",
      correspondingDate: data.correspondingDate ?? "",
      absence: data.absence ?? "",
      illness: data.illness ?? "",
      leaveDays: data.leaveDays ?? "",
      holidays: data.holidays ?? "",
      totalDuration: data.totalDuration ?? "",
      remarks: data.remarks ?? "",
      rows: normalizeRows(data.rows)
    }
  });
  return serialize(row);
}

async function update(id, data) {
  const existing = await prisma.hifzSabqiParaSheet.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Sabqi Para sheet not found");

  const row = await prisma.hifzSabqiParaSheet.update({
    where: { id },
    data: {
      ...(data.classId !== undefined ? { classId: data.classId } : {}),
      ...(data.className !== undefined ? { className: data.className } : {}),
      ...(data.studentId !== undefined ? { studentId: data.studentId } : {}),
      ...(data.studentName !== undefined ? { studentName: data.studentName } : {}),
      ...(data.fatherName !== undefined ? { fatherName: data.fatherName } : {}),
      ...(data.teacherName !== undefined ? { teacherName: data.teacherName } : {}),
      ...(data.monthLabel !== undefined ? { monthLabel: data.monthLabel } : {}),
      ...(data.correspondingDate !== undefined
        ? { correspondingDate: data.correspondingDate }
        : {}),
      ...(data.absence !== undefined ? { absence: data.absence } : {}),
      ...(data.illness !== undefined ? { illness: data.illness } : {}),
      ...(data.leaveDays !== undefined ? { leaveDays: data.leaveDays } : {}),
      ...(data.holidays !== undefined ? { holidays: data.holidays } : {}),
      ...(data.totalDuration !== undefined ? { totalDuration: data.totalDuration } : {}),
      ...(data.remarks !== undefined ? { remarks: data.remarks } : {}),
      ...(data.rows !== undefined ? { rows: normalizeRows(data.rows) } : {})
    }
  });
  return serialize(row);
}

async function upsert(data) {
  const existing = await prisma.hifzSabqiParaSheet.findUnique({
    where: {
      classId_studentId: {
        classId: data.classId,
        studentId: data.studentId
      }
    }
  });

  if (existing) {
    return update(existing.id, data);
  }
  return create(data);
}

async function remove(id) {
  const existing = await prisma.hifzSabqiParaSheet.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Sabqi Para sheet not found");
  await prisma.hifzSabqiParaSheet.delete({ where: { id } });
  return { id };
}

module.exports = {
  list,
  getById,
  create,
  update,
  upsert,
  remove,
  emptyRow,
  normalizeRows,
  PARA_COUNT
};
