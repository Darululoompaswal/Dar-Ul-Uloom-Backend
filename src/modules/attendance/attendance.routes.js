const router = require("express").Router();
const controller = require("./attendance.controller");
const validate = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/role.middleware");
const audit = require("../../middleware/audit.middleware");
const idempotency = require("../../middleware/idempotency.middleware");
const {
  upsertSessionSchema,
  sessionQuerySchema,
  listSessionsSchema,
  sessionIdSchema
} = require("./attendance.validation");

router.use(authenticate);

router.get("/sessions", validate(listSessionsSchema), controller.list);
router.get("/session", validate(sessionQuerySchema), controller.getOne);
router.put(
  "/sessions",
  authorize("SUPER_ADMIN", "ADMIN", "DATA_ENTRY", "TEACHER"),
  idempotency(),
  validate(upsertSessionSchema),
  audit("UPSERT", "ATTENDANCE", (_, body) => body?.data?.id),
  controller.upsert
);
router.delete(
  "/sessions/:id",
  authorize("SUPER_ADMIN", "ADMIN"),
  validate(sessionIdSchema),
  audit("DELETE", "ATTENDANCE", (req) => req.params.id),
  controller.remove
);

module.exports = router;
