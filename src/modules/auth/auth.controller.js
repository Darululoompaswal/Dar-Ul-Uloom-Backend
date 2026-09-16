const asyncHandler = require("../../utils/asyncHandler");
const authService = require("./auth.service");

exports.login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.validated.body);
  res.json({ success: true, data: result });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const data = await authService.updateProfile(req.user.id, req.validated.body);
  res.json({ success: true, data });
});
