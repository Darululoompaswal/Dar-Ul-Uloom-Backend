const router = require("express").Router();
const controller = require("./settings.controller");
const validate = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/role.middleware");
const audit = require("../../middleware/audit.middleware");
const { getSchema, putSchema } = require("./settings.validation");

router.use(authenticate);

router.get("/institution", validate(getSchema), controller.getInstitution);
router.put(
  "/institution",
  authorize("SUPER_ADMIN", "ADMIN"),
  validate(putSchema),
  audit("UPDATE", "INSTITUTION_SETTINGS"),
  controller.putInstitution
);

module.exports = router;
