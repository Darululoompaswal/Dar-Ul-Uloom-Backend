const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const controller = require("./auth.controller");
const validate = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const { loginSchema, updateProfileSchema } = require("./auth.validation");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Try again later." }
});

router.post("/login", loginLimiter, validate(loginSchema), controller.login);
router.get("/me", authenticate, controller.me);
router.patch("/profile", authenticate, validate(updateProfileSchema), controller.updateProfile);

module.exports = router;
