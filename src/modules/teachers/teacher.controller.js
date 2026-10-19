const asyncHandler = require("../../utils/asyncHandler");
const { paginatedResponse } = require("../../utils/pagination");
const service = require("./teacher.service");

exports.create = asyncHandler(async (req, res) => {
  const teacher = await service.create(req.validated.body);
  res.status(201).json({ success: true, data: teacher });
});

exports.list = asyncHandler(async (req, res) => {
  const result = await service.list(req.validated.query);
  res.json(paginatedResponse(result.data, result.total, result.page, result.limit));
});

exports.getById = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.getById(req.params.id) });
});

exports.stats = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.stats() });
});

exports.update = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.update(req.params.id, req.validated.body) });
});

exports.remove = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.remove(req.params.id) });
});

exports.listAttendance = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: await service.listAttendance(req.params.id, req.validated.query)
  });
});

exports.upsertAttendance = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: await service.upsertAttendance(req.params.id, req.validated.body)
  });
});

exports.removeAttendance = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: await service.removeAttendance(req.params.id, req.validated.query.date)
  });
});
