const prisma = require("../../config/prisma");
const { getPagination } = require("../../utils/pagination");

const userSelect = {
  id: true,
  username: true,
  fullName: true,
  role: true,
};

const FINANCE_ENTITY_TYPES = [
  "CASH_TRANSACTION",
  "SALARY_RECORD",
  "FEE_RECORD",
  "KHATA_ENTRY",
  "SUPPLY_EXPENSE",
  "FINANCE_INVENTORY",
  "FINANCE_INVENTORY_USAGE",
  "FINANCE_SPONSOR",
  "FINANCE_SPONSOR_PERFORMANCE",
  "BACKUP",
  "BACKUP_RESTORE"
];

function buildWhere(query, options = {}) {
  const search = query.search?.trim();
  const financeOnly = options.financeOnly === true;

  const where = {
    ...(query.action ? { action: query.action } : {}),
    ...(query.userId ? { userId: query.userId } : {}),
    ...(query.from || query.to
      ? {
          createdAt: {
            ...(query.from ? { gte: query.from } : {}),
            ...(query.to ? { lte: query.to } : {}),
          },
        }
      : {}),
  };

  if (financeOnly) {
    if (query.entityType) {
      if (!FINANCE_ENTITY_TYPES.includes(query.entityType)) {
        where.entityType = { in: [] };
      } else {
        where.entityType = query.entityType;
      }
    } else {
      where.entityType = { in: FINANCE_ENTITY_TYPES };
    }
  } else if (query.entityType) {
    where.entityType = query.entityType;
  }

  if (search) {
    where.OR = [
      { action: { contains: search, mode: "insensitive" } },
      { entityType: { contains: search, mode: "insensitive" } },
      { entityId: { contains: search, mode: "insensitive" } },
      { ipAddress: { contains: search, mode: "insensitive" } },
      { user: { fullName: { contains: search, mode: "insensitive" } } },
      { user: { username: { contains: search, mode: "insensitive" } } },
    ];
  }

  return where;
}

async function list(query, options = {}) {
  const { page, limit, skip } = getPagination(query);
  const where = buildWhere(query, options);

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: userSelect } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { data, total, page, limit };
}

async function stats(options = {}) {
  const baseWhere = options.financeOnly
    ? { entityType: { in: FINANCE_ENTITY_TYPES } }
    : {};

  const [total, creates, updates, deletes] = await Promise.all([
    prisma.auditLog.count({ where: baseWhere }),
    prisma.auditLog.count({ where: { ...baseWhere, action: "CREATE" } }),
    prisma.auditLog.count({ where: { ...baseWhere, action: "UPDATE" } }),
    prisma.auditLog.count({ where: { ...baseWhere, action: "DELETE" } }),
  ]);

  return { total, creates, updates, deletes };
}

module.exports = { list, stats, FINANCE_ENTITY_TYPES };
