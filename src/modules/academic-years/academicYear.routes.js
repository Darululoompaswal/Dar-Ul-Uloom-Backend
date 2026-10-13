const router = require("express").Router();
const controller = require("./academicYear.controller");
const validate = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/role.middleware");
const audit = require("../../middleware/audit.middleware");
const {
  listSchema,
  idSchema,
  createSchema,
  updateSchema
} = require("./academicYear.validation");

router.use(authenticate);

const writeRoles = authorize("SUPER_ADMIN", "ADMIN", "DATA_ENTRY");
const deleteRoles = authorize("SUPER_ADMIN", "ADMIN");

router.get("/", validate(listSchema), controller.list);
router.get("/:id", validate(idSchema), controller.getById);
router.post(
  "/",
  writeRoles,
  validate(createSchema),
  audit("CREATE", "ACADEMIC_YEAR", (_, body) => body?.data?.id),
  controller.create
);
router.patch(
  "/:id",
  writeRoles,
  validate(updateSchema),
  audit("UPDATE", "ACADEMIC_YEAR", (req) => req.params.id),
  controller.update
);
router.post(
  "/:id/set-current",
  writeRoles,
  validate(idSchema),
  audit("UPDATE", "ACADEMIC_YEAR_CURRENT", (req) => req.params.id),
  controller.setCurrent
);
router.delete(
  "/:id",
  deleteRoles,
  validate(idSchema),
  audit("DELETE", "ACADEMIC_YEAR", (req) => req.params.id),
  controller.remove
);

module.exports = router;
