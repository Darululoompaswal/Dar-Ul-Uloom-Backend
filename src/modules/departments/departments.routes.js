const router = require("express").Router();
const controller = require("./departments.controller");
const { authenticate } = require("../../middleware/auth.middleware");
const { forbidRoles } = require("../../middleware/role.middleware");

router.use(authenticate);
router.use(forbidRoles("ADMIN"));

router.get("/", controller.list);

module.exports = router;
