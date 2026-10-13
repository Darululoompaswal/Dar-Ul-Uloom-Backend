const asyncHandler = require("../../utils/asyncHandler");
const { paginatedResponse } = require("../../utils/pagination");
const service = require("./board.service");

exports.stats = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.getStats() });
});

exports.listExams = asyncHandler(async (req, res) => {
  const result = await service.listExams(req.validated.query);
  res.json(paginatedResponse(result.data, result.total, result.page, result.limit));
});

exports.getExam = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.getExam(req.params.id) });
});

exports.createExam = asyncHandler(async (req, res) => {
  const data = await service.createExam(req.validated.body);
  res.status(201).json({ success: true, data });
});

exports.updateExam = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.updateExam(req.params.id, req.validated.body) });
});

exports.removeExam = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.removeExam(req.params.id) });
});

exports.listRegistrations = asyncHandler(async (req, res) => {
  const result = await service.listRegistrations(req.validated.query);
  res.json(paginatedResponse(result.data, result.total, result.page, result.limit));
});

exports.getRegistration = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.getRegistration(req.params.id) });
});

exports.createRegistration = asyncHandler(async (req, res) => {
  const data = await service.createRegistration(req.validated.body);
  res.status(201).json({ success: true, data });
});

exports.updateRegistration = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: await service.updateRegistration(req.params.id, req.validated.body)
  });
});

exports.removeRegistration = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.removeRegistration(req.params.id) });
});
