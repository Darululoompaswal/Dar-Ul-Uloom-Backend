const router = require("express").Router();
const controller = require("./auditLog.controller");
const validate = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/role.middleware");
const { listAuditLogSchema } = require("./auditLog.validation");

router.use(authenticate);
/** Super Admin: all logs. Finance employees: finance entity logs only. */
router.use(authorize("SUPER_ADMIN", "ADMIN"));

router.get("/stats", controller.stats);
router.get("/", validate(listAuditLogSchema), controller.list);

module.exports = router;
