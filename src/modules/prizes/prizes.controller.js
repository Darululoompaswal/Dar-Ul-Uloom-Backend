const asyncHandler = require("../../utils/asyncHandler");
const { paginatedResponse } = require("../../utils/pagination");
const service = require("./prizes.service");

exports.list = asyncHandler(async (req, res) => {
  const result = await service.list(req.validated.query);
  res.json(paginatedResponse(result.data, result.total, result.page, result.limit));
});

exports.stats = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.getStats() });
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

exports.remove = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.remove(req.params.id) });
});
