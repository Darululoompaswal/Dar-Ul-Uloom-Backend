const router = require("express").Router();
const controller = require("./users.controller");
const validate = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/role.middleware");
const audit = require("../../middleware/audit.middleware");
const {
  listUsersSchema,
  createUserSchema,
  updateUserSchema,
  userIdSchema
} = require("./users.validation");

router.use(authenticate);
router.use(authorize("SUPER_ADMIN"));

router.get("/", validate(listUsersSchema), controller.list);
router.get("/seats", controller.seats);
router.post(
  "/",
  validate(createUserSchema),
  audit("CREATE", "USER", (_, body) => body?.data?.id),
  controller.create
);
router.patch(
  "/:id",
  validate(updateUserSchema),
  audit("UPDATE", "USER", (req) => req.params.id),
  controller.update
);
router.delete(
  "/:id",
  validate(userIdSchema),
  audit("DELETE", "USER", (req) => req.params.id),
  controller.deactivate
);

module.exports = router;
