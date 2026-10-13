const router = require("express").Router();
const controller = require("./lectures.controller");
const validate = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/role.middleware");
const audit = require("../../middleware/audit.middleware");
const {
  listByClassSchema,
  createSchema,
  idSchema,
  updateSchema
} = require("./lectures.validation");

router.use(authenticate);

const writeRoles = authorize("SUPER_ADMIN", "ADMIN", "DATA_ENTRY", "TEACHER");
const deleteRoles = authorize("SUPER_ADMIN", "ADMIN");

router.get("/", controller.listAll);
router.get("/by-class/:classId", validate(listByClassSchema), controller.listByClass);
router.post(
  "/by-class/:classId",
  writeRoles,
  validate(createSchema),
  audit("CREATE", "CLASS_LECTURE", (_, body) => body?.data?.id),
  controller.create
);
router.put(
  "/:id",
  writeRoles,
  validate(updateSchema),
  audit("UPDATE", "CLASS_LECTURE", (req) => req.params.id),
  controller.update
);
router.delete(
  "/:id",
  deleteRoles,
  validate(idSchema),
  audit("DELETE", "CLASS_LECTURE", (req) => req.params.id),
  controller.remove
);

module.exports = router;
