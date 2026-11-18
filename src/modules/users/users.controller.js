const asyncHandler = require("../../utils/asyncHandler");
const service = require("./users.service");

exports.list = asyncHandler(async (req, res) => {
  const data = await service.listUsers(req.validated.query);
  res.json({ success: true, data });
});

exports.create = asyncHandler(async (req, res) => {
  const data = await service.createUser(req.validated.body);
  res.status(201).json({ success: true, data });
});

exports.update = asyncHandler(async (req, res) => {
  const data = await service.updateUser(req.params.id, req.validated.body, req.user.id);
  res.json({ success: true, data });
});

exports.deactivate = asyncHandler(async (req, res) => {
  const data = await service.deactivateUser(req.params.id, req.user.id);
  res.json({ success: true, data });
});

exports.seats = asyncHandler(async (req, res) => {
  const data = await service.getSeatSummary();
  res.json({ success: true, data });
});
