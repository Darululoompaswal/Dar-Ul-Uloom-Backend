const express = require("express");
const { authenticate } = require("../middleware/auth.middleware");

/**
 * Authenticated stub for modules that are not yet implemented.
 * Prevents unauthenticated probing of `/api/<name>`.
 */
function createSecurePlaceholderRouter(moduleName) {
  const router = express.Router();
  router.use(authenticate);
  router.get("/", (req, res) => {
    res.json({ success: true, message: `${moduleName} module initialized` });
  });
  return router;
}

module.exports = { createSecurePlaceholderRouter };
