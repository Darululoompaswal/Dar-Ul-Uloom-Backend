const router = require("express").Router();
const controller = require("./board.controller");
const validate = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/role.middleware");
const audit = require("../../middleware/audit.middleware");
const {
  listExamSchema,
  listRegistrationSchema,
  idSchema,
  createExamSchema,
  updateExamSchema,
  createRegistrationSchema,
  updateRegistrationSchema
} = require("./board.validation");

router.use(authenticate);

const writeRoles = authorize("SUPER_ADMIN", "ADMIN", "DATA_ENTRY");
const deleteRoles = authorize("SUPER_ADMIN", "ADMIN");

router.get("/stats", controller.stats);

router.get("/exams", validate(listExamSchema), controller.listExams);
router.get("/exams/:id", validate(idSchema), controller.getExam);
router.post(
  "/exams",
  writeRoles,
  validate(createExamSchema),
  audit("CREATE", "BOARD_EXAM", (_, body) => body?.data?.id),
  controller.createExam
);
router.put(
  "/exams/:id",
  writeRoles,
  validate(updateExamSchema),
  audit("UPDATE", "BOARD_EXAM", (req) => req.params.id),
  controller.updateExam
);
router.delete(
  "/exams/:id",
  deleteRoles,
  validate(idSchema),
  audit("DELETE", "BOARD_EXAM", (req) => req.params.id),
  controller.removeExam
);

router.get("/registrations", validate(listRegistrationSchema), controller.listRegistrations);
router.get("/registrations/:id", validate(idSchema), controller.getRegistration);
router.post(
  "/registrations",
  writeRoles,
  validate(createRegistrationSchema),
  audit("CREATE", "BOARD_REGISTRATION", (_, body) => body?.data?.id),
  controller.createRegistration
);
router.put(
  "/registrations/:id",
  writeRoles,
  validate(updateRegistrationSchema),
  audit("UPDATE", "BOARD_REGISTRATION", (req) => req.params.id),
  controller.updateRegistration
);
router.delete(
  "/registrations/:id",
  deleteRoles,
  validate(idSchema),
  audit("DELETE", "BOARD_REGISTRATION", (req) => req.params.id),
  controller.removeRegistration
);

module.exports = router;
