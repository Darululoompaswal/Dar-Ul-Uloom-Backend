const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const { UPLOAD_FOLDER } = require("./upload.middleware");

exports.create = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(
      422,
      'A file is required in the "file" field. Choose an image or PDF and try again.'
    );
  }

  const originalName = typeof req.file.originalname === "string" ? req.file.originalname.trim() : "";

  res.status(201).json({
    success: true,
    data: {
      // Keep the human-readable name for the UI; stored file uses a UUID on disk.
      fileName: originalName || req.file.filename,
      fileUrl: `/uploads/${UPLOAD_FOLDER}/${req.file.filename}`,
      mimeType: req.file.mimetype,
      fileSize: req.file.size
    }
  });
});
