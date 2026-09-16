const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { notFound, errorHandler } = require("./middleware/error.middleware");

const authRoutes = require("./modules/auth/auth.routes");
const studentRoutes = require("./modules/students/student.routes");
const uploadRoutes = require("./modules/uploads/upload.routes");
const { UPLOAD_ROOT } = require("./modules/uploads/upload.middleware");
const departmentRoutes = require("./modules/departments/departments.routes");
const classRoutes = require("./modules/classes/classes.routes");
const academicYearRoutes = require("./modules/academic-years/academicYear.routes");
const teacherRoutes = require("./modules/teachers/teacher.routes");
const visitRoutes = require("./modules/visitors/visit.routes");
const auditLogRoutes = require("./modules/audit-logs/auditLog.routes");
const financeRoutes = require("./modules/finance/finance.routes");

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
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

app.use("/uploads", express.static(UPLOAD_ROOT));

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/academic-years", academicYearRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/visitors", visitRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/backups", require("./modules/backups/backups.routes"));

const placeholderModules = [
  "attendance", "prizes",
  "inventory", "sponsors", "board", "reports"
];

for (const name of placeholderModules) {
  app.use(`/api/${name}`, require(`./modules/${name}/${name}.routes`));
}

for (const name of ["school", "hifz", "kutub"]) {
  app.use(`/api/${name}`, require(`./modules/${name}/${name}.routes`));
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
