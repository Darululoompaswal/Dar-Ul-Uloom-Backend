const router = require("express").Router();
const controller = require("./teacher.controller");
const validate = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/role.middleware");
const audit = require("../../middleware/audit.middleware");
const idempotency = require("../../middleware/idempotency.middleware");
const {
  listTeacherSchema,
  teacherIdSchema,
  createTeacherSchema,
  updateTeacherSchema
} = require("./teacher.validation");

router.use(authenticate);

router.get("/", validate(listTeacherSchema), controller.list);
router.get("/stats", controller.stats);
router.get("/:id", validate(teacherIdSchema), controller.getById);
router.post("/", authorize("SUPER_ADMIN", "ADMIN", "DATA_ENTRY"), idempotency(), validate(createTeacherSchema), audit("CREATE", "TEACHER", (_, body) => body?.data?.id), controller.create);
router.patch("/:id", authorize("SUPER_ADMIN", "ADMIN", "DATA_ENTRY"), idempotency(), validate(updateTeacherSchema), audit("UPDATE", "TEACHER", req => req.params.id), controller.update);
router.delete("/:id", authorize("SUPER_ADMIN", "ADMIN"), validate(teacherIdSchema), audit("DELETE", "TEACHER", req => req.params.id), controller.remove);

module.exports = router;
