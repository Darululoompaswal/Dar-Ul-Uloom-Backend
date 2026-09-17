const router = require("express").Router();
const controller = require("./backups.controller");
const validate = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/role.middleware");
const audit = require("../../middleware/audit.middleware");
const {
  listBackupsSchema,
  createBackupSchema,
  backupIdSchema
} = require("./backups.validation");

router.use(authenticate);
router.use(authorize("SUPER_ADMIN", "ADMIN"));

router.get("/stats", controller.stats);
router.get("/", validate(listBackupsSchema), controller.list);
router.post(
  "/",
  validate(createBackupSchema),
  audit("CREATE", "BACKUP", (_, body) => body?.data?.id),
  controller.create
);
router.get("/:id/download", validate(backupIdSchema), controller.download);
router.get("/:id", validate(backupIdSchema), controller.get);
router.post(
  "/restore",
  audit("UPDATE", "BACKUP_RESTORE", () => null),
  controller.restore
);
router.delete(
  "/:id",
  validate(backupIdSchema),
  audit("DELETE", "BACKUP", (req) => req.params.id),
  controller.remove
);

module.exports = router;
