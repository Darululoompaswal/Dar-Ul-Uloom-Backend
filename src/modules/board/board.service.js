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

function defaultBoardForDepartment(department) {
  return department === "SCHOOL" ? "GUJRANWALA" : "WIFAQ";
}

function studentSearch(search) {
  return {
    OR: [
      { studentName: { contains: search, mode: "insensitive" } },
      { fatherName: { contains: search, mode: "insensitive" } },
      { registrationNumber: { contains: search, mode: "insensitive" } },
      { className: { contains: search, mode: "insensitive" } },
      { academicYear: { contains: search, mode: "insensitive" } }
    ]
  };
}

function serializeExam(row) {
  return {
    id: row.id,
    studentId: row.studentId ?? null,
    studentName: row.studentName,
    fatherName: row.fatherName ?? "",
    registrationNumber: row.registrationNumber ?? null,
    className: row.className ?? null,
    department: row.department,
    board: row.board,
    academicYear: row.academicYear,
    examSession: row.examSession ?? null,
    result: row.result,
    position: row.position ?? null,
    certificateReceived: Boolean(row.certificateReceived),
    degreeReceived: Boolean(row.degreeReceived),
    notes: row.notes ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function serializeRegistration(row) {
  return {
    id: row.id,
    studentId: row.studentId ?? null,
    studentName: row.studentName,
    fatherName: row.fatherName ?? "",
    registrationNumber: row.registrationNumber ?? null,
    className: row.className ?? null,
    department: row.department,
    board: "WIFAQ",
    academicYear: row.academicYear,
    studyYear: row.studyYear,
    status: row.status,
    registrationDate: formatDateOnly(row.registrationDate),
    notes: row.notes ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

async function getStats() {
  const [exams, regs] = await Promise.all([
    prisma.boardExam.findMany(),
    prisma.boardRegistration.findMany()
  ]);
  return {
    examsTotal: exams.length,
    examsPass: exams.filter((e) => e.result === "PASS").length,
    examsFail: exams.filter((e) => e.result === "FAIL").length,
    examsPending: exams.filter((e) => e.result === "PENDING").length,
    certificatesPending: exams.filter((e) => e.result === "PASS" && !e.certificateReceived).length,
    degreesPending: exams.filter((e) => e.result === "PASS" && !e.degreeReceived).length,
    registrationsTotal: regs.length,
    registrationsComplete: regs.filter((r) => r.status === "COMPLETE").length,
    registrationsSent: regs.filter((r) => r.status === "SENT").length
  };
}

async function listExams(query = {}) {
  const { page, limit, skip } = getPagination(query);
  const search = query.search?.trim();
  const where = {
    ...(query.department ? { department: query.department } : {}),
    ...(query.board ? { board: query.board } : {}),
    ...(query.result ? { result: query.result } : {}),
    ...(query.academicYear ? { academicYear: query.academicYear } : {}),
    ...(search ? studentSearch(search) : {})
  };

  const [rows, total] = await Promise.all([
    prisma.boardExam.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: "desc" }
    }),
    prisma.boardExam.count({ where })
  ]);

  return { data: rows.map(serializeExam), total, page, limit };
}

async function getExam(id) {
  const row = await prisma.boardExam.findUnique({ where: { id } });
  if (!row) throw new ApiError(404, "Board exam not found");
  return serializeExam(row);
}

async function createExam(data) {
  const department = data.department;
  const row = await prisma.boardExam.create({
    data: {
      studentId: data.studentId ?? null,
      studentName: data.studentName,
      fatherName: data.fatherName ?? "",
      registrationNumber: data.registrationNumber ?? null,
      className: data.className ?? null,
      department,
      board: data.board ?? defaultBoardForDepartment(department),
      academicYear: data.academicYear,
      examSession: data.examSession ?? null,
      result: data.result,
      position: data.position ?? null,
      certificateReceived: Boolean(data.certificateReceived),
      degreeReceived: Boolean(data.degreeReceived),
      notes: data.notes ?? null
    }
  });
  return serializeExam(row);
}

async function updateExam(id, data) {
  const existing = await prisma.boardExam.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Board exam not found");
  const department = data.department ?? existing.department;
  const row = await prisma.boardExam.update({
    where: { id },
    data: {
      ...(data.studentId !== undefined ? { studentId: data.studentId ?? null } : {}),
      ...(data.studentName !== undefined ? { studentName: data.studentName } : {}),
      ...(data.fatherName !== undefined ? { fatherName: data.fatherName } : {}),
      ...(data.registrationNumber !== undefined
        ? { registrationNumber: data.registrationNumber ?? null }
        : {}),
      ...(data.className !== undefined ? { className: data.className ?? null } : {}),
      department,
      board: data.board ?? defaultBoardForDepartment(department),
      ...(data.academicYear !== undefined ? { academicYear: data.academicYear } : {}),
      ...(data.examSession !== undefined ? { examSession: data.examSession ?? null } : {}),
      ...(data.result !== undefined ? { result: data.result } : {}),
      ...(data.position !== undefined ? { position: data.position ?? null } : {}),
      ...(data.certificateReceived !== undefined
        ? { certificateReceived: Boolean(data.certificateReceived) }
        : {}),
      ...(data.degreeReceived !== undefined
        ? { degreeReceived: Boolean(data.degreeReceived) }
        : {}),
      ...(data.notes !== undefined ? { notes: data.notes ?? null } : {})
    }
  });
  return serializeExam(row);
}

async function removeExam(id) {
  const existing = await prisma.boardExam.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Board exam not found");
  await prisma.boardExam.delete({ where: { id } });
  return { id };
}

async function listRegistrations(query = {}) {
  const { page, limit, skip } = getPagination(query);
  const search = query.search?.trim();
  const where = {
    ...(query.department ? { department: query.department } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.studyYear ? { studyYear: Number(query.studyYear) } : {}),
    ...(query.academicYear ? { academicYear: query.academicYear } : {}),
    ...(search ? studentSearch(search) : {})
  };

  const [rows, total] = await Promise.all([
    prisma.boardRegistration.findMany({
      where,
      skip,
      take: limit,
      orderBy: { registrationDate: "desc" }
    }),
    prisma.boardRegistration.count({ where })
  ]);

  return { data: rows.map(serializeRegistration), total, page, limit };
}

async function getRegistration(id) {
  const row = await prisma.boardRegistration.findUnique({ where: { id } });
  if (!row) throw new ApiError(404, "Board registration not found");
  return serializeRegistration(row);
}

async function createRegistration(data) {
  const row = await prisma.boardRegistration.create({
    data: {
      studentId: data.studentId ?? null,
      studentName: data.studentName,
      fatherName: data.fatherName ?? "",
      registrationNumber: data.registrationNumber ?? null,
      className: data.className ?? null,
      department: data.department,
      board: "WIFAQ",
      academicYear: data.academicYear,
      studyYear: data.studyYear,
      status: data.status,
      registrationDate: toDateOnly(data.registrationDate),
      notes: data.notes ?? null
    }
  });
  return serializeRegistration(row);
}

async function updateRegistration(id, data) {
  const existing = await prisma.boardRegistration.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Board registration not found");
  const row = await prisma.boardRegistration.update({
    where: { id },
    data: {
      ...(data.studentId !== undefined ? { studentId: data.studentId ?? null } : {}),
      ...(data.studentName !== undefined ? { studentName: data.studentName } : {}),
      ...(data.fatherName !== undefined ? { fatherName: data.fatherName } : {}),
      ...(data.registrationNumber !== undefined
        ? { registrationNumber: data.registrationNumber ?? null }
        : {}),
      ...(data.className !== undefined ? { className: data.className ?? null } : {}),
      ...(data.department !== undefined ? { department: data.department } : {}),
      board: "WIFAQ",
      ...(data.academicYear !== undefined ? { academicYear: data.academicYear } : {}),
      ...(data.studyYear !== undefined ? { studyYear: data.studyYear } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.registrationDate !== undefined
        ? { registrationDate: toDateOnly(data.registrationDate) }
        : {}),
      ...(data.notes !== undefined ? { notes: data.notes ?? null } : {})
    }
  });
  return serializeRegistration(row);
}

async function removeRegistration(id) {
  const existing = await prisma.boardRegistration.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Board registration not found");
  await prisma.boardRegistration.delete({ where: { id } });
  return { id };
}

module.exports = {
  getStats,
  listExams,
  getExam,
  createExam,
  updateExam,
  removeExam,
  listRegistrations,
  getRegistration,
  createRegistration,
  updateRegistration,
  removeRegistration
};
