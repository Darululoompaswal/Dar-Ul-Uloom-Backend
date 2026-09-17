const multer = require("multer");
const ApiError = require("../../utils/ApiError");
const service = require("../../services/backup.service");

const restoreUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const ok =
      file.mimetype === "application/json" ||
      file.mimetype === "application/octet-stream" ||
      (file.originalname && file.originalname.toLowerCase().endsWith(".json"));
    if (!ok) return cb(new ApiError(422, "Only JSON backup files are allowed"));
    cb(null, true);
  }
}).single("file");

exports.list = async (req, res) => {
  res.json({ success: true, data: await service.listBackups() });
};

exports.stats = async (req, res) => {
  res.json({ success: true, data: await service.getBackupStats() });
};

exports.get = async (req, res) => {
  res.json({ success: true, data: await service.getBackup(req.params.id) });
};

exports.create = async (req, res) => {
  const type = req.validated?.body?.type ?? "DATABASE";
  const result = type === "CSV" ? await service.runCsvBackup() : await service.createJsonBackup();
  res.status(201).json({ success: true, data: result });
};

exports.download = async (req, res, next) => {
  try {
    const { filePath, fileName } = await service.downloadBackup(req.params.id);
    res.download(filePath, fileName);
  } catch (error) {
    next(error);
  }
};

exports.restore = (req, res, next) => {
  restoreUpload(req, res, async (error) => {
    if (error) return next(error);
    try {
      let payload;
      if (req.file?.buffer) {
        payload = req.file.buffer.toString("utf8");
      } else if (req.body?.backup) {
        payload = req.body.backup;
      } else {
        throw new ApiError(422, "Upload a backup JSON file");
      }
      const result = await service.restoreFromPayload(payload);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  });
};

exports.remove = async (req, res) => {
  res.json({ success: true, data: await service.deleteBackup(req.params.id) });
};
