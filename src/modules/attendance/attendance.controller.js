const service = require("./attendance.service");
const asyncHandler = require("../../utils/asyncHandler");
const { paginatedResponse } = require("../../utils/pagination");

const upsert = asyncHandler(async (req, res) => {
  const data = await service.upsertSession(req.validated?.body ?? req.body);
  res.json({ success: true, data });
});

const getOne = asyncHandler(async (req, res) => {
  const query = req.validated?.query ?? req.query;
  const data = await service.getSession(query);
  res.json({ success: true, data });
});

const list = asyncHandler(async (req, res) => {
  const result = await service.listSessions(req.validated?.query ?? req.query);
  res.json(paginatedResponse(result.data, result.total, result.page, result.limit));
});

const remove = asyncHandler(async (req, res) => {
  const data = await service.removeSession(req.params.id);
  res.json({ success: true, data });
});

module.exports = { upsert, getOne, list, remove };
