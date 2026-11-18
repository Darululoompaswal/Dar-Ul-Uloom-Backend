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

function backupScopeForUser(req) {
  if (req.user?.role === "ADMIN") return "FINANCE";
  const fromQuery = req.validated?.query?.scope || req.query?.scope;
  const fromBody = req.validated?.body?.scope || req.body?.scope;
  if (fromQuery === "FINANCE" || fromBody === "FINANCE") return "FINANCE";
  return "FULL";
}

exports.list = async (req, res) => {
  const scope = backupScopeForUser(req);
  res.json({ success: true, data: await service.listBackups(scope) });
};

exports.stats = async (req, res) => {
  const scope = backupScopeForUser(req);
  res.json({ success: true, data: await service.getBackupStats(scope) });
};

exports.get = async (req, res) => {
  const scope = backupScopeForUser(req);
  res.json({ success: true, data: await service.getBackup(req.params.id, scope) });
};

exports.create = async (req, res) => {
  const scope = backupScopeForUser(req);
  const type = req.validated?.body?.type ?? "DATABASE";
  const result =
    type === "CSV" ? await service.runCsvBackup(scope) : await service.createJsonBackup(scope);
  res.status(201).json({ success: true, data: result });
};

exports.download = async (req, res, next) => {
  try {
    const scope = backupScopeForUser(req);
    const { filePath, fileName } = await service.downloadBackup(req.params.id, scope);
    res.download(filePath, fileName);
  } catch (error) {
    next(error);
  }
};

exports.restore = (req, res, next) => {
  restoreUpload(req, res, async (error) => {
    if (error) return next(error);
    try {
      const scope = backupScopeForUser(req);
      let payload;
      if (req.file?.buffer) {
        payload = req.file.buffer.toString("utf8");
      } else if (req.body?.backup) {
        payload = req.body.backup;
      } else {
        throw new ApiError(422, "Upload a backup JSON file");
      }
      const result = await service.restoreFromPayload(payload, scope);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  });
};

exports.remove = async (req, res) => {
  const scope = backupScopeForUser(req);
  res.json({ success: true, data: await service.deleteBackup(req.params.id, scope) });
};
