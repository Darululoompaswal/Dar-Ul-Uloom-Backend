const asyncHandler = require("../../utils/asyncHandler");
const service = require("./academicYear.service");

exports.list = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.list(req.validated?.query ?? req.query) });
});

exports.getById = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.getById(req.params.id) });
});

exports.create = asyncHandler(async (req, res) => {
  const data = await service.create(req.validated.body);
  res.status(201).json({ success: true, data });
});

exports.update = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.update(req.params.id, req.validated.body) });
});

exports.setCurrent = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.setCurrent(req.params.id) });
});

exports.remove = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.remove(req.params.id) });
});
