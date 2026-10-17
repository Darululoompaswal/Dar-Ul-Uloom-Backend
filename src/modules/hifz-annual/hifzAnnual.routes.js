const router = require("express").Router();
const controller = require("./hifzAnnual.controller");
const validate = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/role.middleware");
const audit = require("../../middleware/audit.middleware");
const {
  listSchema,
  idSchema,
  createSchema,
  updateSchema
} = require("./hifzAnnual.validation");

router.use(authenticate);

const writeRoles = authorize("SUPER_ADMIN", "ADMIN", "DATA_ENTRY", "TEACHER");
const deleteRoles = authorize("SUPER_ADMIN", "ADMIN");

router.get("/", validate(listSchema), controller.list);
router.get("/:id", validate(idSchema), controller.getById);
router.post(
  "/",
  writeRoles,
  validate(createSchema),
  audit("CREATE", "HIFZ_ANNUAL", (_, body) => body?.data?.id),
  controller.create
);
router.put(
  "/upsert",
  writeRoles,
  validate(createSchema),
  audit("UPDATE", "HIFZ_ANNUAL", (_, body) => body?.data?.id),
  controller.upsert
);
router.put(
  "/:id",
  writeRoles,
  validate(updateSchema),
  audit("UPDATE", "HIFZ_ANNUAL", (req) => req.params.id),
  controller.update
);
router.delete(
  "/:id",
  deleteRoles,
  validate(idSchema),
  audit("DELETE", "HIFZ_ANNUAL", (req) => req.params.id),
  controller.remove
);

module.exports = router;