const path = require("path");
const fs = require("fs");
const express = require("express");

const { authenticateFileAccess } = require("../../middleware/auth.middleware");
const ApiError = require("../../utils/ApiError");
const { UPLOAD_ROOT } = require("./upload.middleware");

const UPLOAD_BASE = path.resolve(UPLOAD_ROOT);

/**
 * Authenticated file server for `/uploads/*`.
 * Rejects path traversal and directory listings; never caches responses.
 */
function createProtectedUploadRouter() {
  const router = express.Router();

  router.use(authenticateFileAccess);

  router.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next(new ApiError(405, "Method not allowed"));
    }

    const relative = decodeURIComponent((req.path || "").replace(/^\/+/, ""));
    if (!relative || relative.includes("\0")) {
      return next(new ApiError(400, "Invalid file path"));
    }

    const target = path.resolve(UPLOAD_BASE, relative);
    if (target !== UPLOAD_BASE && !target.startsWith(UPLOAD_BASE + path.sep)) {
      return next(new ApiError(403, "Forbidden"));
    }

    let stat;
    try {
      stat = fs.statSync(target);
    } catch {
      return next(new ApiError(404, "File not found"));
    }

    if (!stat.isFile()) {
      return next(new ApiError(404, "File not found"));
    }

    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.sendFile(target, (error) => {
      if (error) next(error);
    });
  });

  return router;
}

module.exports = { createProtectedUploadRouter };
