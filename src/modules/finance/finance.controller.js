const asyncHandler = require("../../utils/asyncHandler");
const service = require("./finance.service");

exports.getStore = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.getStore() });
});

exports.getSummary = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.getSummary() });
});

exports.listCash = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.listCashTransactions(req.validated.query) });
});

exports.createCash = asyncHandler(async (req, res) => {
  const data = await service.createCashTransaction(req.validated.body);
  res.status(201).json({ success: true, data });
});

exports.updateCash = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.updateCashTransaction(req.params.id, req.validated.body) });
});

exports.deleteCash = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.deleteCashTransaction(req.params.id) });
});

exports.listSalaries = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.listSalaryRecords(req.validated.query) });
});

exports.createSalary = asyncHandler(async (req, res) => {
  const data = await service.createSalaryRecord(req.validated.body);
  res.status(201).json({ success: true, data });
});

exports.updateSalary = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.updateSalaryRecord(req.params.id, req.validated.body) });
});

exports.deleteSalary = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.deleteSalaryRecord(req.params.id) });
});

exports.listKhata = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.listKhataEntries() });
});

exports.createKhata = asyncHandler(async (req, res) => {
  const data = await service.createKhataEntry(req.validated.body);
  res.status(201).json({ success: true, data });
});

exports.updateKhata = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.updateKhataEntry(req.params.id, req.validated.body) });
});

exports.deleteKhata = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.deleteKhataEntry(req.params.id) });
});

exports.listSupplies = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.listSupplyExpenses(req.validated.query) });
});

exports.createSupply = asyncHandler(async (req, res) => {
  const data = await service.createSupplyExpense(req.validated.body);
  res.status(201).json({ success: true, data });
});

exports.updateSupply = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.updateSupplyExpense(req.params.id, req.validated.body) });
});

exports.deleteSupply = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.deleteSupplyExpense(req.params.id) });
});

exports.listInventory = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.listInventoryItems() });
});

exports.createInventory = asyncHandler(async (req, res) => {
  const data = await service.createInventoryItem(req.validated.body);
  res.status(201).json({ success: true, data });
});

exports.updateInventory = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.updateInventoryItem(req.params.id, req.validated.body) });
});

exports.deleteInventory = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.deleteInventoryItem(req.params.id) });
});

exports.listInventoryUsages = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.listInventoryUsages(req.validated.query) });
});

exports.createInventoryUsage = asyncHandler(async (req, res) => {
  const data = await service.createInventoryUsage(req.validated.body);
  res.status(201).json({ success: true, data });
});

exports.getInventoryDailySummary = asyncHandler(async (req, res) => {
  const date = req.validated.query.date;
  res.json({ success: true, data: await service.getInventoryDailySummary(date) });
});

exports.listSponsors = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.listSponsorRecords() });
});

exports.createSponsor = asyncHandler(async (req, res) => {
  const data = await service.createSponsorRecord(req.validated.body);
  res.status(201).json({ success: true, data });
});

exports.updateSponsor = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.updateSponsorRecord(req.params.id, req.validated.body) });
});

exports.deleteSponsor = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.deleteSponsorRecord(req.params.id) });
});
