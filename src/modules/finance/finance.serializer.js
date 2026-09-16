function decimalToNumber(value) {
  if (value == null) return 0;
  return Number(value);
}

function formatDateOnly(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

function toDateOnly(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function serializeCashTransaction(row) {
  return {
    id: row.id,
    type: row.type,
    amount: decimalToNumber(row.amount),
    date: formatDateOnly(row.date),
    category: row.category,
    description: row.description,
    reference: row.reference,
    createdAt: row.createdAt.toISOString()
  };
}

function serializeSalaryRecord(row) {
  return {
    id: row.id,
    employeeName: row.employeeName,
    month: row.month,
    amount: decimalToNumber(row.amount),
    status: row.status,
    paidDate: formatDateOnly(row.paidDate),
    notes: row.notes,
    createdAt: row.createdAt.toISOString()
  };
}

function serializeKhataEntry(row) {
  const amount = decimalToNumber(row.amount);
  const settledAmount = decimalToNumber(row.settledAmount);
  return {
    id: row.id,
    partyName: row.partyName,
    type: row.type,
    amount,
    settledAmount,
    pendingAmount: Math.max(0, amount - settledAmount),
    date: formatDateOnly(row.date),
    description: row.description,
    createdAt: row.createdAt.toISOString()
  };
}

function serializeSupplyExpense(row) {
  return {
    id: row.id,
    category: row.category,
    amount: decimalToNumber(row.amount),
    date: formatDateOnly(row.date),
    description: row.description,
    vendor: row.vendor,
    payDate: formatDateOnly(row.payDate),
    payerName: row.payerName ?? null,
    paidAmount: decimalToNumber(row.paidAmount),
    pendingAmount: decimalToNumber(row.pendingAmount),
    quantity: decimalToNumber(row.quantity),
    createdAt: row.createdAt.toISOString()
  };
}

function serializeInventoryItem(row) {
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    notes: row.notes,
    updatedAt: row.updatedAt.toISOString()
  };
}

function serializeSponsorRecord(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    monthlyAmount: decimalToNumber(row.monthlyAmount),
    studentCount: row.studentCount,
    notes: row.notes,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString()
  };
}

module.exports = {
  decimalToNumber,
  formatDateOnly,
  toDateOnly,
  serializeCashTransaction,
  serializeSalaryRecord,
  serializeKhataEntry,
  serializeSupplyExpense,
  serializeInventoryItem,
  serializeSponsorRecord
};
