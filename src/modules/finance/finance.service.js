const prisma = require("../../config/prisma");
const ApiError = require("../../utils/ApiError");
const {
  toDateOnly,
  formatDateOnly,
  serializeCashTransaction,
  serializeSalaryRecord,
  serializeKhataEntry,
  serializeSupplyExpense,
  serializeInventoryItem,
  serializeInventoryUsage,
  serializeSponsorRecord
} = require("./finance.serializer");

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

async function getStore() {
  const [
    cashTransactions,
    salaries,
    khataEntries,
    supplyExpenses,
    inventoryItems,
    sponsors
  ] = await Promise.all([
    prisma.cashTransaction.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.salaryRecord.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.khataEntry.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.supplyExpense.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.financeInventoryItem.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.financeSponsor.findMany({ orderBy: { createdAt: "desc" } })
  ]);

  return {
    cashTransactions: cashTransactions.map(serializeCashTransaction),
    salaries: salaries.map(serializeSalaryRecord),
    khataEntries: khataEntries.map(serializeKhataEntry),
    supplyExpenses: supplyExpenses.map(serializeSupplyExpense),
    inventoryItems: inventoryItems.map(serializeInventoryItem),
    sponsors: sponsors.map(serializeSponsorRecord)
  };
}

async function getSummary() {
  const store = await getStore();
  const month = currentMonthKey();

  const cashIn = store.cashTransactions
    .filter((row) => row.type === "IN")
    .reduce((sum, row) => sum + row.amount, 0);

  const cashOut = store.cashTransactions
    .filter((row) => row.type === "OUT")
    .reduce((sum, row) => sum + row.amount, 0);

  const salariesPending = store.salaries
    .filter((row) => row.status === "PENDING")
    .reduce((sum, row) => sum + row.amount, 0);

  const salariesPaidThisMonth = store.salaries
    .filter((row) => row.status === "PAID" && row.month === month)
    .reduce((sum, row) => sum + row.amount, 0);

  const khataBalance = store.khataEntries.reduce((sum, row) => {
    const pending = row.pendingAmount ?? Math.max(0, row.amount - (row.settledAmount ?? 0));
    return row.type === "CREDIT" ? sum + pending : sum - pending;
  }, 0);

  const suppliesThisMonth = store.supplyExpenses
    .filter((row) => row.date.startsWith(month))
    .reduce((sum, row) => sum + row.amount, 0);

  const activeSponsors = store.sponsors.filter((row) => row.isActive).length;

  const sponsorshipMonthly = store.sponsors
    .filter((row) => row.isActive)
    .reduce((sum, row) => sum + row.monthlyAmount, 0);

  return {
    cashIn,
    cashOut,
    netCash: cashIn - cashOut,
    salariesPending,
    salariesPaidThisMonth,
    khataBalance,
    suppliesThisMonth,
    inventoryItems: store.inventoryItems.length,
    activeSponsors,
    sponsorshipMonthly
  };
}

async function listCashTransactions(query) {
  const rows = await prisma.cashTransaction.findMany({
    where: query.type ? { type: query.type } : undefined,
    orderBy: { createdAt: "desc" }
  });
  return rows.map(serializeCashTransaction);
}

async function createCashTransaction(data) {
  const row = await prisma.cashTransaction.create({
    data: {
      type: data.type,
      amount: data.amount,
      date: toDateOnly(data.date),
      category: data.category,
      description: data.description,
      reference: data.reference ?? null
    }
  });
  return serializeCashTransaction(row);
}

async function updateCashTransaction(id, data) {
  await assertExists("cashTransaction", id, "Cash transaction not found");
  const row = await prisma.cashTransaction.update({
    where: { id },
    data: {
      type: data.type,
      amount: data.amount,
      date: toDateOnly(data.date),
      category: data.category,
      description: data.description,
      reference: data.reference ?? null
    }
  });
  return serializeCashTransaction(row);
}

async function deleteCashTransaction(id) {
  await assertExists("cashTransaction", id, "Cash transaction not found");
  await prisma.cashTransaction.delete({ where: { id } });
  return { id };
}

async function listSalaryRecords(query) {
  const rows = await prisma.salaryRecord.findMany({
    where: query.status ? { status: query.status } : undefined,
    orderBy: { createdAt: "desc" }
  });
  return rows.map(serializeSalaryRecord);
}

async function createSalaryRecord(data) {
  const paidDate = data.status === "PAID"
    ? toDateOnly(data.paidDate ?? new Date().toISOString().slice(0, 10))
    : null;

  const row = await prisma.salaryRecord.create({
    data: {
      employeeName: data.employeeName,
      month: data.month,
      amount: data.amount,
      status: data.status,
      paidDate,
      notes: data.notes ?? null
    }
  });
  return serializeSalaryRecord(row);
}

async function updateSalaryRecord(id, data) {
  await assertExists("salaryRecord", id, "Salary record not found");
  const paidDate = data.status === "PAID"
    ? toDateOnly(data.paidDate ?? new Date().toISOString().slice(0, 10))
    : null;

  const row = await prisma.salaryRecord.update({
    where: { id },
    data: {
      employeeName: data.employeeName,
      month: data.month,
      amount: data.amount,
      status: data.status,
      paidDate,
      notes: data.notes ?? null
    }
  });
  return serializeSalaryRecord(row);
}

async function deleteSalaryRecord(id) {
  await assertExists("salaryRecord", id, "Salary record not found");
  await prisma.salaryRecord.delete({ where: { id } });
  return { id };
}

async function listKhataEntries() {
  const rows = await prisma.khataEntry.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(serializeKhataEntry);
}

async function createKhataEntry(data) {
  const row = await prisma.khataEntry.create({
    data: {
      partyName: data.partyName,
      type: data.type,
      amount: data.amount,
      settledAmount: Number(data.settledAmount ?? 0),
      date: toDateOnly(data.date),
      description: data.description
    }
  });
  return serializeKhataEntry(row);
}

async function updateKhataEntry(id, data) {
  await assertExists("khataEntry", id, "Khata entry not found");
  const row = await prisma.khataEntry.update({
    where: { id },
    data: {
      partyName: data.partyName,
      type: data.type,
      amount: data.amount,
      settledAmount: Number(data.settledAmount ?? 0),
      date: toDateOnly(data.date),
      description: data.description
    }
  });
  return serializeKhataEntry(row);
}

async function deleteKhataEntry(id) {
  await assertExists("khataEntry", id, "Khata entry not found");
  await prisma.khataEntry.delete({ where: { id } });
  return { id };
}

async function listSupplyExpenses(query) {
  const rows = await prisma.supplyExpense.findMany({
    where: query.category ? { category: query.category } : undefined,
    orderBy: { createdAt: "desc" }
  });
  return rows.map(serializeSupplyExpense);
}

function resolveSupplyPaymentFields(data) {
  const paidAmount = Number(data.paidAmount ?? 0);
  const pendingAmount = Math.max(0, Number(data.amount) - paidAmount);
  return {
    payDate: data.payDate ? toDateOnly(data.payDate) : null,
    payerName: data.payerName ?? null,
    paidAmount,
    pendingAmount,
    quantity: Number(data.quantity ?? 1)
  };
}

async function createSupplyExpense(data) {
  const payment = resolveSupplyPaymentFields(data);
  const row = await prisma.supplyExpense.create({
    data: {
      category: data.category,
      amount: data.amount,
      date: toDateOnly(data.date),
      description: data.description,
      vendor: data.vendor ?? null,
      ...payment
    }
  });
  return serializeSupplyExpense(row);
}

async function updateSupplyExpense(id, data) {
  await assertExists("supplyExpense", id, "Supply expense not found");
  const payment = resolveSupplyPaymentFields(data);
  const row = await prisma.supplyExpense.update({
    where: { id },
    data: {
      category: data.category,
      amount: data.amount,
      date: toDateOnly(data.date),
      description: data.description,
      vendor: data.vendor ?? null,
      ...payment
    }
  });
  return serializeSupplyExpense(row);
}

async function deleteSupplyExpense(id) {
  await assertExists("supplyExpense", id, "Supply expense not found");
  await prisma.supplyExpense.delete({ where: { id } });
  return { id };
}

async function listInventoryItems() {
  const rows = await prisma.financeInventoryItem.findMany({ orderBy: { updatedAt: "desc" } });
  return rows.map(serializeInventoryItem);
}

async function createInventoryItem(data) {
  const row = await prisma.financeInventoryItem.create({
    data: {
      name: data.name,
      quantity: data.quantity,
      unit: data.unit ?? "pcs",
      notes: data.notes ?? null
    }
  });
  return serializeInventoryItem(row);
}

async function updateInventoryItem(id, data) {
  await assertExists("financeInventoryItem", id, "Inventory item not found");
  const row = await prisma.financeInventoryItem.update({
    where: { id },
    data: {
      name: data.name,
      quantity: data.quantity,
      unit: data.unit ?? "pcs",
      notes: data.notes ?? null
    }
  });
  return serializeInventoryItem(row);
}

async function deleteInventoryItem(id) {
  await assertExists("financeInventoryItem", id, "Inventory item not found");
  await prisma.financeInventoryItem.delete({ where: { id } });
  return { id };
}

async function listInventoryUsages(query = {}) {
  const where = {};
  if (query.date) {
    where.date = toDateOnly(query.date);
  }
  if (query.itemId) {
    where.itemId = query.itemId;
  }

  const rows = await prisma.financeInventoryUsage.findMany({
    where,
    include: { item: { select: { name: true, unit: true } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: query.date ? undefined : 100
  });

  return rows.map(serializeInventoryUsage);
}

async function createInventoryUsage(data) {
  const item = await prisma.financeInventoryItem.findUnique({ where: { id: data.itemId } });
  if (!item) throw new ApiError(404, "Inventory item not found");
  if (data.quantity > item.quantity) {
    throw new ApiError(400, "Usage quantity exceeds available stock");
  }

  const row = await prisma.$transaction(async (tx) => {
    const usage = await tx.financeInventoryUsage.create({
      data: {
        itemId: data.itemId,
        quantity: data.quantity,
        date: toDateOnly(data.date),
        notes: data.notes ?? null
      },
      include: { item: { select: { name: true, unit: true } } }
    });

    await tx.financeInventoryItem.update({
      where: { id: data.itemId },
      data: { quantity: { decrement: data.quantity } }
    });

    return usage;
  });

  return serializeInventoryUsage(row);
}

async function getInventoryDailySummary(date) {
  const day = toDateOnly(date);
  const rows = await prisma.financeInventoryUsage.findMany({
    where: { date: day },
    include: { item: { select: { id: true, name: true, unit: true, quantity: true } } },
    orderBy: { createdAt: "asc" }
  });

  const byItem = new Map();
  for (const row of rows) {
    const existing = byItem.get(row.itemId);
    if (existing) {
      existing.quantityUsed += row.quantity;
    } else {
      byItem.set(row.itemId, {
        itemId: row.itemId,
        name: row.item.name,
        unit: row.item.unit,
        quantityUsed: row.quantity,
        currentStock: row.item.quantity
      });
    }
  }

  return {
    date: formatDateOnly(day),
    items: Array.from(byItem.values()).sort((a, b) => a.name.localeCompare(b.name)),
    usages: rows.map(serializeInventoryUsage)
  };
}

async function listSponsorRecords() {
  const rows = await prisma.financeSponsor.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(serializeSponsorRecord);
}

async function createSponsorRecord(data) {
  const row = await prisma.financeSponsor.create({
    data: {
      name: data.name,
      phone: data.phone ?? null,
      monthlyAmount: data.monthlyAmount,
      studentCount: data.studentCount ?? 1,
      notes: data.notes ?? null,
      isActive: data.isActive ?? true
    }
  });
  return serializeSponsorRecord(row);
}

async function updateSponsorRecord(id, data) {
  await assertExists("financeSponsor", id, "Sponsor record not found");
  const row = await prisma.financeSponsor.update({
    where: { id },
    data: {
      name: data.name,
      phone: data.phone ?? null,
      monthlyAmount: data.monthlyAmount,
      studentCount: data.studentCount ?? 1,
      notes: data.notes ?? null,
      isActive: data.isActive ?? true
    }
  });
  return serializeSponsorRecord(row);
}

async function deleteSponsorRecord(id) {
  await assertExists("financeSponsor", id, "Sponsor record not found");
  await prisma.financeSponsor.delete({ where: { id } });
  return { id };
}

async function assertExists(model, id, message) {
  const row = await prisma[model].findUnique({ where: { id }, select: { id: true } });
  if (!row) throw new ApiError(404, message);
}

module.exports = {
  getStore,
  getSummary,
  listCashTransactions,
  createCashTransaction,
  updateCashTransaction,
  deleteCashTransaction,
  listSalaryRecords,
  createSalaryRecord,
  updateSalaryRecord,
  deleteSalaryRecord,
  listKhataEntries,
  createKhataEntry,
  updateKhataEntry,
  deleteKhataEntry,
  listSupplyExpenses,
  createSupplyExpense,
  updateSupplyExpense,
  deleteSupplyExpense,
  listInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  listInventoryUsages,
  createInventoryUsage,
  getInventoryDailySummary,
  listSponsorRecords,
  createSponsorRecord,
  updateSponsorRecord,
  deleteSponsorRecord
};
