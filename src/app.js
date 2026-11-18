const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const env = require("./config/env");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const authRoutes = require("./modules/auth/auth.routes");
const studentRoutes = require("./modules/students/student.routes");
const uploadRoutes = require("./modules/uploads/upload.routes");
const { createProtectedUploadRouter } = require("./modules/uploads/serve-uploads");
const { createSecurePlaceholderRouter } = require("./modules/_secure-placeholder.routes");
const departmentRoutes = require("./modules/departments/departments.routes");
const classRoutes = require("./modules/classes/classes.routes");
const academicYearRoutes = require("./modules/academic-years/academicYear.routes");
const teacherRoutes = require("./modules/teachers/teacher.routes");
const visitRoutes = require("./modules/visitors/visit.routes");
const auditLogRoutes = require("./modules/audit-logs/auditLog.routes");
const financeRoutes = require("./modules/finance/finance.routes");
const syncRoutes = require("./modules/sync/sync.routes");
const attendanceRoutes = require("./modules/attendance/attendance.routes");

const app = express();

function resolveCorsOrigin() {
  const raw = env.CORS_ORIGIN;
  if (!raw) {
    // Production: same-origin / proxy only. Dev: reflect request origin for local tools.
    return env.NODE_ENV === "production" ? false : true;
  }
  if (raw === "*") {
    return true;
  }
  const list = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (list.length === 0) return false;
  return list.length === 1 ? list[0] : list;
}

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: resolveCorsOrigin(),
    credentials: true
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/api", rateLimit({ windowMs: 60 * 1000, limit: 300 }));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Madrassa Management API is running",
    timestamp: new Date().toISOString()
  });
});

app.use("/uploads", createProtectedUploadRouter());

app.use("/api/auth", authRoutes);
app.use("/api/users", require("./modules/users/users.routes"));
app.use("/api/students", studentRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/academic-years", academicYearRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/visitors", visitRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/backups", require("./modules/backups/backups.routes"));
app.use("/api/prizes", require("./modules/prizes/prizes.routes"));
app.use("/api/board", require("./modules/board/board.routes"));
app.use("/api/hifz-progress", require("./modules/hifz-progress/hifzProgress.routes"));
app.use("/api/hifz-sabqi-para", require("./modules/hifz-sabqi-para/hifzSabqiPara.routes"));
app.use("/api/hifz-annual", require("./modules/hifz-annual/hifzAnnual.routes"));
app.use("/api/exam-results", require("./modules/exam-results/examResults.routes"));
app.use("/api/lectures", require("./modules/lectures/lectures.routes"));
app.use("/api/settings", require("./modules/settings/settings.routes"));

const placeholderModules = ["inventory", "sponsors", "reports", "school", "hifz", "kutub"];

for (const name of placeholderModules) {
  app.use(`/api/${name}`, createSecurePlaceholderRouter(name));
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
