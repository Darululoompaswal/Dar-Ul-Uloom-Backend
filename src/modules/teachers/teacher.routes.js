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
  updateTeacherSchema,
  listTeacherAttendanceSchema,
  upsertTeacherAttendanceSchema,
  deleteTeacherAttendanceSchema
} = require("./teacher.validation");

router.use(authenticate);

const writeRoles = authorize("SUPER_ADMIN", "ADMIN", "DATA_ENTRY");

router.get("/", validate(listTeacherSchema), controller.list);
router.get("/stats", controller.stats);
router.get("/:id/attendance", validate(listTeacherAttendanceSchema), controller.listAttendance);
router.put(
  "/:id/attendance",
  writeRoles,
  validate(upsertTeacherAttendanceSchema),
  audit("UPDATE", "TEACHER_ATTENDANCE", (req) => req.params.id),
  controller.upsertAttendance
);
router.delete(
  "/:id/attendance",
  writeRoles,
  validate(deleteTeacherAttendanceSchema),
  audit("DELETE", "TEACHER_ATTENDANCE", (req) => req.params.id),
  controller.removeAttendance
);
router.get("/:id", validate(teacherIdSchema), controller.getById);
router.post("/", writeRoles, idempotency(), validate(createTeacherSchema), audit("CREATE", "TEACHER", (_, body) => body?.data?.id), controller.create);
router.patch("/:id", writeRoles, idempotency(), validate(updateTeacherSchema), audit("UPDATE", "TEACHER", req => req.params.id), controller.update);
router.delete("/:id", authorize("SUPER_ADMIN", "ADMIN"), validate(teacherIdSchema), audit("DELETE", "TEACHER", req => req.params.id), controller.remove);

module.exports = router;
