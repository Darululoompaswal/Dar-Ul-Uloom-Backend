const asyncHandler = require("../../utils/asyncHandler");
const service = require("./lectures.service");

exports.listByClass = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.listByClass(req.params.classId) });
});

exports.listAll = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.listAll() });
});

exports.create = asyncHandler(async (req, res) => {
  const data = await service.create(req.params.classId, req.validated.body);
  res.status(201).json({ success: true, data });
});

exports.update = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.update(req.params.id, req.validated.body) });
});

exports.remove = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.remove(req.params.id) });
});
