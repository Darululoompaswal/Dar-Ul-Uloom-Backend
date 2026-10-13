const asyncHandler = require("../../utils/asyncHandler");
const service = require("./classes.service");

exports.list = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.list(req.validated.query) });
});

exports.create = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await service.create(req.validated.body) });
});

exports.update = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: await service.update(req.params.id, req.validated.body)
  });
});

exports.remove = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.remove(req.params.id) });
});

exports.listStudents = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.listStudents(req.params.id) });
});
