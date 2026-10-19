const prisma = require("../../config/prisma");
const ApiError = require("../../utils/ApiError");
const { SYNC_ENTITIES } = require("./sync.validation");
const attendanceService = require("../attendance/attendance.service");
const financeService = require("../finance/finance.service");
const { serializeCashTransaction } = require("../finance/finance.serializer");

const PROTOCOL_VERSION = 1;

const ENTITY_DELEGATES = {
  department: () => prisma.department,
  academicYear: () => prisma.academicYear,
  class: () => prisma.class,
  student: () => prisma.student,
  teacher: () => prisma.teacher,
  cashTransaction: () => prisma.cashTransaction,
  attendanceSession: () => prisma.attendanceSession,
  attendanceRecord: () => prisma.attendanceRecord
};

function parseEntities(raw) {
  if (!raw?.trim()) return [...SYNC_ENTITIES];
  const requested = raw.split(",").map((part) => part.trim()).filter(Boolean);
  const invalid = requested.filter((name) => !SYNC_ENTITIES.includes(name));
  if (invalid.length) {
    throw new ApiError(422, `Unsupported entities: ${invalid.join(", ")}`);
  }
  return requested;
}

function parseCursor(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (!parsed?.updatedAt || !parsed?.id) return null;
    return { updatedAt: new Date(parsed.updatedAt), id: parsed.id };
  } catch {
    return null;
  }
}

function encodeCursor(updatedAt, id) {
  return Buffer.from(JSON.stringify({ updatedAt: new Date(updatedAt).toISOString(), id }), "utf8").toString(
    "base64url"
  );
}

function changedWhere(since, cursor) {
  const sinceDate = since ? new Date(since) : new Date(0);
  if (!cursor) {
    return {
      OR: [{ updatedAt: { gt: sinceDate } }, { deletedAt: { gt: sinceDate } }]
    };
  }
  return {
    OR: [
      { updatedAt: { gt: cursor.updatedAt } },
      {
        AND: [{ updatedAt: cursor.updatedAt }, { id: { gt: cursor.id } }]
      },
      { deletedAt: { gt: sinceDate } }
    ]
  };
}

async function getStatus() {
  return {
    protocolVersion: PROTOCOL_VERSION,
    serverTime: new Date().toISOString(),
    entities: SYNC_ENTITIES
  };
}

async function bootstrap() {
  const [departments, academicYears, classes] = await Promise.all([
    prisma.department.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { nameEn: "asc" }
    }),
    prisma.academicYear.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { startDate: "desc" }
    }),
    prisma.class.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { nameEn: "asc" }
    })
  ]);

  return {
    protocolVersion: PROTOCOL_VERSION,
    serverTime: new Date().toISOString(),
    departments,
    academicYears,
    classes
  };
}

async function getChanges({ since, entities, cursor, limit = 200 }) {
  const entityNames = parseEntities(entities);
  const decodedCursor = parseCursor(cursor);
  const take = Math.min(Math.max(Number(limit) || 200, 1), 500);
  const changes = {};
  let nextCursor = null;

  for (const entity of entityNames) {
    const delegate = ENTITY_DELEGATES[entity]();
    const rows = await delegate.findMany({
      where: changedWhere(since, decodedCursor),
      orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
      take
    });

    changes[entity] = rows.map((row) => ({
      id: row.id,
      deleted: Boolean(row.deletedAt),
      updatedAt: row.updatedAt?.toISOString?.() ?? null,
      deletedAt: row.deletedAt?.toISOString?.() ?? null,
      version: row.version ?? null,
      data: row.deletedAt ? null : row
    }));

    const last = rows[rows.length - 1];
    if (last && (!nextCursor || new Date(last.updatedAt) > new Date(nextCursor.updatedAt))) {
      nextCursor = { updatedAt: last.updatedAt, id: last.id };
    }
  }

  return {
    protocolVersion: PROTOCOL_VERSION,
    serverTime: new Date().toISOString(),
    since: since ?? null,
    changes,
    nextCursor: nextCursor ? encodeCursor(nextCursor.updatedAt, nextCursor.id) : null
  };
}

async function applyOutbox(userId, mutations) {
  const results = [];

  for (const mutation of mutations) {
    const existing = await prisma.clientMutation.findUnique({
      where: { clientMutationId: mutation.clientMutationId }
    });

    if (existing) {
      results.push({
        clientMutationId: mutation.clientMutationId,
        status: "duplicate",
        entityType: existing.entityType,
        entityId: existing.entityId,
        result: existing.resultJson
      });
      continue;
    }

    try {
      const applied = await applyOne(userId, mutation);
      await prisma.clientMutation.create({
        data: {
          clientMutationId: mutation.clientMutationId,
          userId,
          entityType: mutation.entityType,
          entityId: applied.entityId ?? null,
          operation: mutation.operation,
          resultJson: applied
        }
      });
      results.push({
        clientMutationId: mutation.clientMutationId,
        status: applied.status,
        entityType: mutation.entityType,
        entityId: applied.entityId ?? null,
        result: applied
      });
    } catch (error) {
      results.push({
        clientMutationId: mutation.clientMutationId,
        status: "error",
        entityType: mutation.entityType,
        entityId: mutation.entityId ?? null,
        error: error.message || "Failed to apply mutation"
      });
    }
  }

  return { results, serverTime: new Date().toISOString() };
}

async function applyOne(userId, mutation) {
  const { entityType, operation, entityId, baseVersion, payload } = mutation;

  if (entityType === "student") {
    return applyStudent(operation, entityId, baseVersion, payload);
  }
  if (entityType === "teacher") {
    return applyTeacher(operation, entityId, baseVersion, payload);
  }
  if (entityType === "cashTransaction") {
    return applyCash(operation, entityId, baseVersion, payload);
  }
  if (entityType === "attendance") {
    return applyAttendance(operation, entityId, payload);
  }

  throw new ApiError(422, `Unsupported entityType: ${entityType}`);
}

async function applyStudent(operation, entityId, baseVersion, payload) {
  if (operation === "CREATE") {
    const created = await prisma.student.create({
      data: {
        ...(payload.id ? { id: payload.id } : {}),
        registrationNumber: payload.registrationNumber ?? null,
        fullNameEn: payload.fullNameEn ?? null,
        fullNameUr: payload.fullNameUr ?? null,
        fatherNameEn: payload.fatherNameEn ?? null,
        fatherNameUr: payload.fatherNameUr ?? null,
        dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : null,
        gender: payload.gender ?? null,
        phonePrimary: payload.phonePrimary ?? null,
        status: payload.status ?? "ACTIVE",
        version: 1
      }
    });
    return { status: "applied", entityId: created.id, version: created.version, data: created };
  }

  const existing = await prisma.student.findFirst({ where: { id: entityId, deletedAt: null } });
  if (!existing) throw new ApiError(404, "Student not found");
  if (baseVersion != null && existing.version !== baseVersion) {
    return { status: "conflict", entityId, version: existing.version, data: existing };
  }

  if (operation === "DELETE") {
    const updated = await prisma.student.update({
      where: { id: entityId },
      data: { deletedAt: new Date(), version: { increment: 1 } }
    });
    return { status: "applied", entityId, version: updated.version };
  }

  const updated = await prisma.student.update({
    where: { id: entityId },
    data: {
      registrationNumber: payload.registrationNumber ?? existing.registrationNumber,
      fullNameEn: payload.fullNameEn ?? existing.fullNameEn,
      fullNameUr: payload.fullNameUr ?? existing.fullNameUr,
      fatherNameEn: payload.fatherNameEn ?? existing.fatherNameEn,
      fatherNameUr: payload.fatherNameUr ?? existing.fatherNameUr,
      phonePrimary: payload.phonePrimary ?? existing.phonePrimary,
      status: payload.status ?? existing.status,
      version: { increment: 1 }
    }
  });
  return { status: "applied", entityId, version: updated.version, data: updated };
}

async function applyTeacher(operation, entityId, baseVersion, payload) {
  if (operation === "CREATE") {
    const created = await prisma.teacher.create({
      data: {
        ...(payload.id ? { id: payload.id } : {}),
        employeeNumber: payload.employeeNumber,
        firstName: payload.firstName,
        lastName: payload.lastName ?? null,
        fatherName: payload.fatherName ?? null,
        phone: payload.phone ?? null,
        status: payload.status ?? "ACTIVE",
        version: 1
      }
    });
    return { status: "applied", entityId: created.id, version: created.version, data: created };
  }

  const existing = await prisma.teacher.findFirst({ where: { id: entityId, deletedAt: null } });
  if (!existing) throw new ApiError(404, "Teacher not found");
  if (baseVersion != null && existing.version !== baseVersion) {
    return { status: "conflict", entityId, version: existing.version, data: existing };
  }

  if (operation === "DELETE") {
    const updated = await prisma.teacher.update({
      where: { id: entityId },
      data: { deletedAt: new Date(), version: { increment: 1 } }
    });
    return { status: "applied", entityId, version: updated.version };
  }

  const updated = await prisma.teacher.update({
    where: { id: entityId },
    data: {
      firstName: payload.firstName ?? existing.firstName,
      lastName: payload.lastName ?? existing.lastName,
      fatherName: payload.fatherName ?? existing.fatherName,
      phone: payload.phone ?? existing.phone,
      status: payload.status ?? existing.status,
      version: { increment: 1 }
    }
  });
  return { status: "applied", entityId, version: updated.version, data: updated };
}

async function applyCash(operation, entityId, baseVersion, payload) {
  if (operation === "CREATE") {
    const created = await financeService.createCashTransaction({
      type: payload.type,
      amount: payload.amount,
      date: payload.date,
      category: payload.category,
      description: payload.description,
      reference: payload.reference ?? null,
      receiptNumber: payload.receiptNumber ?? null,
      donorName: payload.donorName ?? null,
      donorAddress: payload.donorAddress ?? null,
      billNumber: payload.billNumber ?? null,
      paidBy: payload.paidBy ?? null
    });
    return { status: "applied", entityId: created.id, version: 1, data: created };
  }

  const existing = await prisma.cashTransaction.findFirst({
    where: { id: entityId, deletedAt: null }
  });
  if (!existing) throw new ApiError(404, "Cash transaction not found");
  if (baseVersion != null && existing.version !== baseVersion) {
    return {
      status: "conflict",
      entityId,
      version: existing.version,
      data: serializeCashTransaction(existing)
    };
  }

  if (operation === "DELETE") {
    await financeService.deleteCashTransaction(entityId);
    return { status: "applied", entityId, version: existing.version + 1 };
  }

  const updated = await financeService.updateCashTransaction(entityId, {
    type: payload.type ?? existing.type,
    amount: payload.amount ?? Number(existing.amount),
    date: payload.date ?? existing.date.toISOString().slice(0, 10),
    category: payload.category ?? existing.category,
    description: payload.description ?? existing.description,
    reference: payload.reference ?? existing.reference,
    receiptNumber: payload.receiptNumber ?? existing.receiptNumber,
    donorName: payload.donorName ?? existing.donorName,
    donorAddress: payload.donorAddress ?? existing.donorAddress,
    billNumber: payload.billNumber ?? existing.billNumber,
    paidBy: payload.paidBy ?? existing.paidBy
  });
  return { status: "applied", entityId, version: (existing.version ?? 1) + 1, data: updated };
}

async function applyAttendance(_operation, _entityId, payload) {
  const sheet = await attendanceService.upsertSession({
    departmentId: payload.departmentId,
    classId: payload.classId,
    date: payload.date,
    sessionType: payload.sessionType ?? "DAILY",
    entries: payload.entries ?? []
  });
  return { status: "applied", entityId: sheet.id, data: sheet };
}

module.exports = {
  PROTOCOL_VERSION,
  getStatus,
  bootstrap,
  getChanges,
  applyOutbox
};
