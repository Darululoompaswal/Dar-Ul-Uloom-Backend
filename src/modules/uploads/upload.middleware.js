const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const ApiError = require("../../utils/ApiError");

const UPLOAD_ROOT = path.join(__dirname, "..", "..", "..", "uploads");
const UPLOAD_FOLDER = "students";
const UPLOAD_DIR = path.join(UPLOAD_ROOT, UPLOAD_FOLDER);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Extension comes from resolved mime type, never from the client file name alone. */
const EXTENSION_BY_MIME = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf"
};

const MIME_BY_EXTENSION = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf"
};

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function resolveMimeType(file) {
  if (file.mimetype && EXTENSION_BY_MIME[file.mimetype]) {
    return file.mimetype;
  }
  const ext = path.extname(file.originalname || "").toLowerCase();
  return MIME_BY_EXTENSION[ext] || null;
}

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const mime = resolveMimeType(file);
    const extension = mime ? EXTENSION_BY_MIME[mime] : "";
    cb(null, `${crypto.randomUUID()}${extension}`);
  }
});

const handler = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (req, file, cb) => {
    const mime = resolveMimeType(file);
    if (!mime) {
      return cb(
        new ApiError(
          422,
          `Unsupported file type${file.mimetype ? `: ${file.mimetype}` : ""}. Allowed: JPEG, PNG, WebP, GIF, or PDF.`
        )
      );
    }
    // Normalize so controller / disk storage see a known type (helps empty browser MIME).
    file.mimetype = mime;
    cb(null, true);
  }
}).single("file");

const uploadSingle = (req, res, next) =>
  handler(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      const message =
        error.code === "LIMIT_FILE_SIZE"
          ? "File is larger than the 5 MB limit. Compress the scan or choose a smaller file."
          : `Upload failed: ${error.message}`;
      return next(new ApiError(422, message));
    }
    next(error);
  });

module.exports = { UPLOAD_ROOT, UPLOAD_FOLDER, uploadSingle, EXTENSION_BY_MIME };
