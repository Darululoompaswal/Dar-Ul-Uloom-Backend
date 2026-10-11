const service = require("./sync.service");
const asyncHandler = require("../../utils/asyncHandler");

const status = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await service.getStatus() });
});

const bootstrap = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await service.bootstrap() });
});

const changes = asyncHandler(async (req, res) => {
  const query = req.validated?.query ?? req.query;
  res.json({ success: true, data: await service.getChanges(query) });
});

const outbox = asyncHandler(async (req, res) => {
  const body = req.validated?.body ?? req.body;
  const data = await service.applyOutbox(req.user.id, body.mutations);
  res.json({ success: true, data });
});

module.exports = { status, bootstrap, changes, outbox };
