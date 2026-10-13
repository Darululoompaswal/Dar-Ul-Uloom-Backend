const prisma = require("../../config/prisma");
const ApiError = require("../../utils/ApiError");

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
    name: row.name,
    startDate: formatDateOnly(row.startDate),
    endDate: formatDateOnly(row.endDate),
    isCurrent: Boolean(row.isCurrent),
    isActive: Boolean(row.isActive),
    createdAt: row.createdAt?.toISOString?.() ?? undefined,
    updatedAt: row.updatedAt?.toISOString?.() ?? undefined
  };
}

async function clearCurrent(tx, exceptId) {
  await tx.academicYear.updateMany({
    where: {
      isCurrent: true,
      ...(exceptId ? { id: { not: exceptId } } : {})
    },
    data: { isCurrent: false }
  });
}

async function list(query = {}) {
  const includeInactive = Boolean(query.includeInactive);
  const rows = await prisma.academicYear.findMany({
    where: {
      deletedAt: null,
      ...(includeInactive ? {} : { isActive: true })
    },
    orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }]
  });
  return rows.map(serialize);
}

async function getById(id) {
  const row = await prisma.academicYear.findFirst({
    where: { id, deletedAt: null }
  });
  if (!row) throw new ApiError(404, "Academic year not found");
  return serialize(row);
}

async function create(data) {
  const row = await prisma.$transaction(async (tx) => {
    if (data.isCurrent) {
      await clearCurrent(tx);
    }
    return tx.academicYear.create({
      data: {
        name: data.name.trim(),
        startDate: toDateOnly(data.startDate),
        endDate: toDateOnly(data.endDate),
        isCurrent: Boolean(data.isCurrent),
        isActive: data.isActive ?? true
      }
    });
  });
  return serialize(row);
}

async function update(id, data) {
  const existing = await prisma.academicYear.findFirst({
    where: { id, deletedAt: null }
  });
  if (!existing) throw new ApiError(404, "Academic year not found");

  const row = await prisma.$transaction(async (tx) => {
    const isCurrent = data.isCurrent ?? existing.isCurrent;
    if (isCurrent) {
      await clearCurrent(tx, id);
    }
    return tx.academicYear.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.startDate !== undefined ? { startDate: toDateOnly(data.startDate) } : {}),
        ...(data.endDate !== undefined ? { endDate: toDateOnly(data.endDate) } : {}),
        ...(data.isCurrent !== undefined ? { isCurrent: Boolean(data.isCurrent) } : {}),
        ...(data.isActive !== undefined ? { isActive: Boolean(data.isActive) } : {})
      }
    });
  });
  return serialize(row);
}

async function setCurrent(id) {
  const existing = await prisma.academicYear.findFirst({
    where: { id, deletedAt: null }
  });
  if (!existing) throw new ApiError(404, "Academic year not found");

  const row = await prisma.$transaction(async (tx) => {
    await clearCurrent(tx, id);
    return tx.academicYear.update({
      where: { id },
      data: { isCurrent: true, isActive: true }
    });
  });
  return serialize(row);
}

async function remove(id) {
  const existing = await prisma.academicYear.findFirst({
    where: { id, deletedAt: null }
  });
  if (!existing) throw new ApiError(404, "Academic year not found");

  await prisma.academicYear.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false, isCurrent: false }
  });
  return { id };
}

module.exports = { list, getById, create, update, setCurrent, remove };
