const asyncHandler = require("../../utils/asyncHandler");
const { paginatedResponse } = require("../../utils/pagination");
const service = require("./auditLog.service");

function financeOnlyForUser(req) {
  return req.user?.role === "ADMIN";
}

exports.list = asyncHandler(async (req, res) => {
  const result = await service.list(req.validated.query, {
    financeOnly: financeOnlyForUser(req),
  });
  res.json(paginatedResponse(result.data, result.total, result.page, result.limit));
});

exports.stats = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: await service.stats({ financeOnly: financeOnlyForUser(req) }),
  });
});
