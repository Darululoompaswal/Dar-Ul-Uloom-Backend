const prisma = require("../../config/prisma");
const ApiError = require("../../utils/ApiError");

function emptyTerm(term) {
  return {
    term,
    periodFrom: "",
    periodTo: "",
    lessonPosition: "",
    readingAmount: "",
    totalReading: "",
    daysSuspended: "",
    prayerReading: "",
    attendanceTotal: "",
    attendanceAbsent: "",
    attendancePresent: "",
    marksZabt: "",
    marksTajweed: "",
    marksLahja: "",
    marksPrayer: "",
    marksTotal: "",
    remarks: ""
  };
}

function normalizeTerms(terms) {
  const byTerm = new Map();
  for (const entry of Array.isArray(terms) ? terms : []) {
    const termNumber = Number(entry?.term);
    if (termNumber === 1 || termNumber === 2 || termNumber === 3) {
      byTerm.set(termNumber, { ...emptyTerm(termNumber), ...entry, term: termNumber });
    }
  }
  return [1, 2, 3].map((term) => byTerm.get(term) ?? emptyTerm(term));
}

function serialize(row) {
  return {
    id: row.id,
    classId: row.classId,
    className: row.className,
    studentId: row.studentId,
    studentName: row.studentName,
    fatherName: row.fatherName ?? "",
    residence: row.residence ?? "",
    district: row.district ?? "",
    academicYear: row.academicYear,
    departmentLabel: row.departmentLabel ?? "شعبہ حفظ",
    terms: normalizeTerms(row.terms),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

async function list(query = {}) {
  const where = {
    ...(query.classId ? { classId: query.classId } : {}),
    ...(query.studentId ? { studentId: query.studentId } : {}),
    ...(query.academicYear ? { academicYear: query.academicYear } : {})
  };
  const rows = await prisma.hifzAnnualResult.findMany({
    where,
    orderBy: { updatedAt: "desc" }
  });
  return rows.map(serialize);
}

async function getById(id) {
  const row = await prisma.hifzAnnualResult.findUnique({ where: { id } });
  if (!row) throw new ApiError(404, "Hifz annual result not found");
  return serialize(row);
}

async function create(data) {
  const existing = await prisma.hifzAnnualResult.findUnique({
    where: {
      classId_studentId_academicYear: {
        classId: data.classId,
        studentId: data.studentId,
        academicYear: data.academicYear
      }
    }
  });
  if (existing) {
    throw new ApiError(409, "Annual result already exists for this student/class/year");
  }

  const row = await prisma.hifzAnnualResult.create({
    data: {
      classId: data.classId,
      className: data.className,
      studentId: data.studentId,
      studentName: data.studentName,
      fatherName: data.fatherName ?? "",
      residence: data.residence ?? "",
      district: data.district ?? "",
      academicYear: data.academicYear,
      departmentLabel: data.departmentLabel ?? "شعبہ حفظ",
      terms: normalizeTerms(data.terms)
    }
  });
  return serialize(row);
}

async function update(id, data) {
  const existing = await prisma.hifzAnnualResult.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Hifz annual result not found");

  const row = await prisma.hifzAnnualResult.update({
    where: { id },
    data: {
      ...(data.classId !== undefined ? { classId: data.classId } : {}),
      ...(data.className !== undefined ? { className: data.className } : {}),
      ...(data.studentId !== undefined ? { studentId: data.studentId } : {}),
      ...(data.studentName !== undefined ? { studentName: data.studentName } : {}),
      ...(data.fatherName !== undefined ? { fatherName: data.fatherName } : {}),
      ...(data.residence !== undefined ? { residence: data.residence } : {}),
      ...(data.district !== undefined ? { district: data.district } : {}),
      ...(data.academicYear !== undefined ? { academicYear: data.academicYear } : {}),
      ...(data.departmentLabel !== undefined ? { departmentLabel: data.departmentLabel } : {}),
      ...(data.terms !== undefined ? { terms: normalizeTerms(data.terms) } : {})
    }
  });
  return serialize(row);
}

async function upsert(data) {
  const existing = await prisma.hifzAnnualResult.findUnique({
    where: {
      classId_studentId_academicYear: {
        classId: data.classId,
        studentId: data.studentId,
        academicYear: data.academicYear
      }
    }
  });

  if (existing) {
    return update(existing.id, data);
  }
  return create(data);
}

async function remove(id) {
  const existing = await prisma.hifzAnnualResult.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Hifz annual result not found");
  await prisma.hifzAnnualResult.delete({ where: { id } });
  return { id };
}

module.exports = { list, getById, create, update, upsert, remove, emptyTerm, normalizeTerms };
