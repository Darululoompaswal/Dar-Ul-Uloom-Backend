const asyncHandler = require("../../utils/asyncHandler");
const service = require("./settings.service");

exports.getInstitution = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.getInstitution() });
});

exports.putInstitution = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.putInstitution(req.validated.body) });
});
