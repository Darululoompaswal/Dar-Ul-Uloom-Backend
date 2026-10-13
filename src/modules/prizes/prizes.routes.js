const router = require("express").Router();
const controller = require("./prizes.controller");
const validate = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/role.middleware");
const audit = require("../../middleware/audit.middleware");
const {
  listSchema,
  idSchema,
  createSchema,
  updateSchema
} = require("./prizes.validation");

router.use(authenticate);

const writeRoles = authorize("SUPER_ADMIN", "ADMIN", "DATA_ENTRY");
const deleteRoles = authorize("SUPER_ADMIN", "ADMIN");

router.get("/", validate(listSchema), controller.list);
router.get("/stats", controller.stats);
router.get("/:id", validate(idSchema), controller.getById);
router.post(
  "/",
  writeRoles,
  validate(createSchema),
  audit("CREATE", "PRIZE", (_, body) => body?.data?.id),
  controller.create
);
router.put(
  "/:id",
  writeRoles,
  validate(updateSchema),
  audit("UPDATE", "PRIZE", (req) => req.params.id),
  controller.update
);
router.delete(
  "/:id",
  deleteRoles,
  validate(idSchema),
  audit("DELETE", "PRIZE", (req) => req.params.id),
  controller.remove
);

module.exports = router;
