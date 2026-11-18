const router = require("express").Router();
const controller = require("./visit.controller");
const validate = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/role.middleware");
const { forbidRoles } = require("../../middleware/role.middleware");
const audit = require("../../middleware/audit.middleware");
const {
  listVisitSchema,
  visitIdSchema,
  createVisitSchema,
  updateVisitSchema
} = require("./visit.validation");

router.use(authenticate);
router.use(forbidRoles("ADMIN"));

router.get("/", validate(listVisitSchema), controller.list);
router.get("/stats", controller.stats);
router.get("/:id", validate(visitIdSchema), controller.getById);
router.post("/", authorize("SUPER_ADMIN", "DATA_ENTRY"), validate(createVisitSchema), audit("CREATE", "VISIT", (_, body) => body?.data?.id), controller.create);
router.patch("/:id", authorize("SUPER_ADMIN", "DATA_ENTRY"), validate(updateVisitSchema), audit("UPDATE", "VISIT", req => req.params.id), controller.update);
router.delete("/:id", authorize("SUPER_ADMIN"), validate(visitIdSchema), audit("DELETE", "VISIT", req => req.params.id), controller.remove);

module.exports = router;
