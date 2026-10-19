const asyncHandler = require("../../utils/asyncHandler");
const service = require("./hifzSabqiPara.service");

exports.list = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.list(req.validated.query) });
});

exports.getById = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.getById(req.params.id) });
});

exports.create = asyncHandler(async (req, res) => {
  const data = await service.create(req.validated.body);
  res.status(201).json({ success: true, data });
});

exports.upsert = asyncHandler(async (req, res) => {
  const data = await service.upsert(req.validated.body);
  res.json({ success: true, data });
});

exports.update = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.update(req.params.id, req.validated.body) });
});

exports.remove = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.remove(req.params.id) });
});
