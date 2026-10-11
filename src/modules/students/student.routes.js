const router = require("express").Router();
const controller = require("./student.controller");
const validate = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/role.middleware");
const audit = require("../../middleware/audit.middleware");
const idempotency = require("../../middleware/idempotency.middleware");
const { createStudentSchema, updateStudentSchema, deleteStudentSchema, assignClassSchema, updateAdmissionPlacementSchema } = require("./student.validation");

router.use(authenticate);

router.get("/", controller.list);
router.get("/:id", controller.getById);
router.post("/", authorize("SUPER_ADMIN", "ADMIN", "DATA_ENTRY"), idempotency(), validate(createStudentSchema), audit("CREATE", "STUDENT", (_, body) => body?.data?.id), controller.create);
router.patch("/:id", authorize("SUPER_ADMIN", "ADMIN", "DATA_ENTRY"), idempotency(), validate(updateStudentSchema), audit("UPDATE", "STUDENT", req => req.params.id), controller.update);
router.patch("/:id/class", authorize("SUPER_ADMIN", "ADMIN", "DATA_ENTRY"), validate(assignClassSchema), audit("UPDATE", "STUDENT", req => req.params.id), controller.assignClass);
router.patch("/:id/admission", authorize("SUPER_ADMIN", "ADMIN", "DATA_ENTRY"), validate(updateAdmissionPlacementSchema), audit("UPDATE", "STUDENT", req => req.params.id), controller.updateAdmissionPlacement);
router.delete("/:id", authorize("SUPER_ADMIN", "ADMIN"), validate(deleteStudentSchema), audit("DELETE", "STUDENT", req => req.params.id), controller.remove);

module.exports = router;
