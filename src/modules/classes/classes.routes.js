const router = require("express").Router();
const controller = require("./classes.controller");
const validate = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/role.middleware");
const audit = require("../../middleware/audit.middleware");
const {
  listClassesSchema,
  createClassSchema,
  updateClassSchema,
  deleteClassSchema,
  classIdSchema
} = require("./classes.validation");
const lecturesController = require("../lectures/lectures.controller");
const {
  listByClassSchema,
  createSchema: createLectureSchema
} = require("../lectures/lectures.validation");

router.use(authenticate);

router.get("/", validate(listClassesSchema), controller.list);
router.get("/:id/students", validate(classIdSchema), controller.listStudents);
router.get(
  "/:classId/lectures",
  validate(listByClassSchema),
  lecturesController.listByClass
);
router.post(
  "/:classId/lectures",
  authorize("SUPER_ADMIN", "ADMIN", "DATA_ENTRY", "TEACHER"),
  validate(createLectureSchema),
  audit("CREATE", "CLASS_LECTURE", (_, body) => body?.data?.id),
  lecturesController.create
);
router.post(
  "/",
  authorize("SUPER_ADMIN", "ADMIN", "DATA_ENTRY"),
  validate(createClassSchema),
  audit("CREATE", "CLASS", (_, body) => body?.data?.id),
  controller.create
);
router.patch(
  "/:id",
  authorize("SUPER_ADMIN", "ADMIN", "DATA_ENTRY"),
  validate(updateClassSchema),
  audit("UPDATE", "CLASS", (req) => req.params.id),
  controller.update
);
router.delete(
  "/:id",
  authorize("SUPER_ADMIN", "ADMIN"),
  validate(deleteClassSchema),
  audit("DELETE", "CLASS", (req) => req.params.id),
  controller.remove
);

module.exports = router;
