const router = require("express").Router();
const controller = require("./sync.controller");
const validate = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/role.middleware");
const idempotency = require("../../middleware/idempotency.middleware");
const { changesQuerySchema, outboxBodySchema } = require("./sync.validation");

router.use(authenticate);

router.get("/status", controller.status);
router.get("/bootstrap", controller.bootstrap);
router.get("/changes", validate(changesQuerySchema), controller.changes);
router.post(
  "/outbox",
  authorize("SUPER_ADMIN", "ADMIN", "DATA_ENTRY", "TEACHER"),
  idempotency(),
  validate(outboxBodySchema),
  controller.outbox
);

module.exports = router;
