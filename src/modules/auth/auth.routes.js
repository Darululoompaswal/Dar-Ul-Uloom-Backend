const router = require("express").Router();
const controller = require("./auth.controller");
const validate = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const { loginSchema, updateProfileSchema } = require("./auth.validation");

router.post("/login", validate(loginSchema), controller.login);
router.get("/me", authenticate, controller.me);
router.patch("/profile", authenticate, validate(updateProfileSchema), controller.updateProfile);

module.exports = router;
