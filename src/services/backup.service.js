const fs = require("fs/promises");
const path = require("path");
const prisma = require("../config/prisma");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const { exportCsv } = require("./csv.service");

/** Tables exported for DATABASE (JSON) backups, in restore-safe parent→child order. */
const JSON_TABLES = [
  { key: "departments", model: "department" },
  { key: "academicYears", model: "academicYear" },
  { key: "prizeCategories", model: "prizeCategory" },
  { key: "students", model: "student" },
  { key: "teachers", model: "teacher" },
  { key: "guardians", model: "guardian" },
  { key: "studentDocuments", model: "studentDocument" },
  { key: "studentStatusHistories", model: "studentStatusHistory" },
  { key: "studentAdmissions", model: "studentAdmission" },
  { key: "classes", model: "class" },
  { key: "studentEnrollments", model: "studentEnrollment" },
  { key: "teacherDepartments", model: "teacherDepartment" },
  { key: "timetables", model: "timetable" },
  { key: "timetableEntries", model: "timetableEntry" },
  { key: "attendanceSessions", model: "attendanceSession" },
  { key: "attendanceRecords", model: "attendanceRecord" },
  { key: "hifzDailyReports", model: "hifzDailyReport" },
  { key: "visits", model: "visit" },
  { key: "studentPrizes", model: "studentPrize" },
  { key: "inventoryItems", model: "inventoryItem" },
  { key: "inventoryTransactions", model: "inventoryTransaction" },
  { key: "sponsors", model: "sponsor" },
  { key: "sponsorships", model: "sponsorship" },
  { key: "boardApplications", model: "boardApplication" },
  { key: "cashTransactions", model: "cashTransaction" },
  { key: "salaryRecords", model: "salaryRecord" },
  { key: "khataEntries", model: "khataEntry" },
  { key: "supplyExpenses", model: "supplyExpense" },
  { key: "financeInventoryItems", model: "financeInventoryItem" },
  { key: "financeInventoryUsages", model: "financeInventoryUsage" },
  { key: "financeSponsors", model: "financeSponsor" }
];

const CSV_TABLES = {
  students: () => prisma.student.findMany(),
  student_admissions: () => prisma.studentAdmission.findMany(),
  guardians: () => prisma.guardian.findMany(),
  student_documents: () => prisma.studentDocument.findMany(),
  teachers: () => prisma.teacher.findMany(),
  departments: () => prisma.department.findMany(),
  academic_years: () => prisma.academicYear.findMany(),
  classes: () => prisma.class.findMany(),
  attendance_records: () => prisma.attendanceRecord.findMany(),
  hifz_daily_reports: () => prisma.hifzDailyReport.findMany(),
  visits: () => prisma.visit.findMany(),
  sponsors: () => prisma.sponsor.findMany(),
  sponsorships: () => prisma.sponsorship.findMany(),
  inventory_items: () => prisma.inventoryItem.findMany(),
  inventory_transactions: () => prisma.inventoryTransaction.findMany(),
  board_applications: () => prisma.boardApplication.findMany(),
  cash_transactions: () => prisma.cashTransaction.findMany(),
  salary_records: () => prisma.salaryRecord.findMany(),
  khata_entries: () => prisma.khataEntry.findMany(),
  supply_expenses: () => prisma.supplyExpense.findMany(),
  finance_inventory_items: () => prisma.financeInventoryItem.findMany(),
  finance_sponsors: () => prisma.financeSponsor.findMany()
};

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function serializeValue(value) {
  if (value instanceof Date) return value.toISOString();
  if (value !== null && typeof value === "object" && typeof value.toNumber === "function") {
    return value.toNumber();
  }
  return value;
}

function serializeRow(row) {
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] = serializeValue(value);
  }
  return out;
}

async function directorySize(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    let total = 0;
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        total += await directorySize(full);
      } else {
        const stat = await fs.stat(full);
        total += stat.size;
      }
    }
    return total;
  } catch {
    return 0;
  }
}

async function pathSize(location) {
  try {
    const stat = await fs.stat(location);
    if (stat.isDirectory()) return directorySize(location);
    return stat.size;
  } catch {
    return 0;
  }
}

async function collectJsonData() {
  const data = {};
  for (const table of JSON_TABLES) {
    const rows = await prisma[table.model].findMany();
    data[table.key] = rows.map(serializeRow);
  }
  return data;
}

function buildJsonPayload(data) {
  return {
    version: 1,
    kind: "madrassa-backup",
    createdAt: new Date().toISOString(),
    type: "DATABASE",
    scopes: JSON_TABLES.map((table) => table.key),
    data
  };
}

async function createJsonBackup() {
  const createdAt = new Date().toISOString();
  const folderStamp = stamp();
  const folder = path.resolve(env.BACKUP_DIR, folderStamp);
  await fs.mkdir(folder, { recursive: true });

  const data = await collectJsonData();
  const payload = buildJsonPayload(data);
  payload.createdAt = createdAt;

  const fileName = `dup-backup-${folderStamp}.json`;
  const filePath = path.join(folder, fileName);
  const json = JSON.stringify(payload, null, 2);
  await fs.writeFile(filePath, json, "utf8");

  const log = await prisma.backupLog.create({
    data: { type: "DATABASE", location: filePath, status: "SUCCESS" }
  });

  const sizeBytes = Buffer.byteLength(json, "utf8");

  return {
    id: log.id,
    type: log.type,
    status: log.status,
    location: log.location,
    fileName,
    sizeBytes,
    createdAt: log.createdAt.toISOString(),
    error: null
  };
}

async function runCsvBackup() {
  const directory = path.resolve(env.BACKUP_DIR, stamp());
  const exported = [];

  try {
    for (const [name, loader] of Object.entries(CSV_TABLES)) {
      const rows = await loader();
      exported.push(await exportCsv(directory, `${name}.csv`, rows));
    }

    const log = await prisma.backupLog.create({
      data: { type: "CSV", location: directory, status: "SUCCESS" }
    });

    return {
      id: log.id,
      type: log.type,
      status: log.status,
      location: log.location,
      fileName: path.basename(directory),
      sizeBytes: await pathSize(directory),
      createdAt: log.createdAt.toISOString(),
      error: null,
      exported
    };
  } catch (error) {
    await prisma.backupLog.create({
      data: {
        type: "CSV",
        location: directory,
        status: "FAILED",
        error: error.message
      }
    });
    throw error;
  }
}

function serializeBackupLog(row, sizeBytes = 0) {
  const isFile = row.location.toLowerCase().endsWith(".json");
  return {
    id: row.id,
    type: row.type,
    status: row.status === "SUCCESS" ? "completed" : row.status === "FAILED" ? "failed" : "pending",
    rawStatus: row.status,
    location: row.location,
    fileName: path.basename(row.location),
    sizeBytes,
    createdAt: row.createdAt.toISOString(),
    error: row.error,
    destination: "remote",
    downloadable: isFile || row.type === "DATABASE"
  };
}

async function listBackups() {
  const rows = await prisma.backupLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  const items = [];
  for (const row of rows) {
    items.push(serializeBackupLog(row, await pathSize(row.location)));
  }
  return items;
}

async function getBackupStats() {
  const [total, success, failed, latest] = await Promise.all([
    prisma.backupLog.count(),
    prisma.backupLog.count({ where: { status: "SUCCESS" } }),
    prisma.backupLog.count({ where: { status: "FAILED" } }),
    prisma.backupLog.findFirst({
      where: { status: "SUCCESS" },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return {
    total,
    success,
    failed,
    lastBackupAt: latest?.createdAt?.toISOString() ?? null,
    lastBackupType: latest?.type ?? null
  };
}

async function getBackupOrThrow(id) {
  const row = await prisma.backupLog.findUnique({ where: { id } });
  if (!row) throw new ApiError(404, "Backup not found");
  return row;
}

async function getBackup(id) {
  const row = await getBackupOrThrow(id);
  return serializeBackupLog(row, await pathSize(row.location));
}

async function resolveDownloadPath(row) {
  const stat = await fs.stat(row.location).catch(() => null);
  if (!stat) throw new ApiError(404, "Backup file is missing on the server");

  if (stat.isFile()) {
    return { filePath: row.location, fileName: path.basename(row.location) };
  }

  // CSV backups are directories — prefer a single JSON sibling if present, else first file
  const entries = await fs.readdir(row.location);
  const jsonFile = entries.find((name) => name.endsWith(".json"));
  if (jsonFile) {
    return { filePath: path.join(row.location, jsonFile), fileName: jsonFile };
  }

  throw new ApiError(
    400,
    "This CSV backup is a folder of files and cannot be downloaded as a single file. Create a database backup instead."
  );
}

async function downloadBackup(id) {
  const row = await getBackupOrThrow(id);
  if (row.status !== "SUCCESS") throw new ApiError(400, "Only successful backups can be downloaded");
  return resolveDownloadPath(row);
}

function parseBackupPayload(raw) {
  const payload = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (!payload || payload.kind !== "madrassa-backup" || payload.version !== 1) {
    throw new ApiError(422, "Invalid backup file format");
  }
  if (!payload.data || typeof payload.data !== "object") {
    throw new ApiError(422, "Backup file has no data");
  }
  return payload;
}

async function restoreFromPayload(payloadInput) {
  const payload = parseBackupPayload(payloadInput);
  const data = payload.data;

  // Delete in reverse dependency order, then recreate parent→child.
  const deleteOrder = [...JSON_TABLES].reverse();

  await prisma.$transaction(
    async (tx) => {
      for (const table of deleteOrder) {
        await tx[table.model].deleteMany({});
      }

      for (const table of JSON_TABLES) {
        const rows = data[table.key];
        if (!Array.isArray(rows) || rows.length === 0) continue;
        await tx[table.model].createMany({ data: rows });
      }
    },
    { timeout: 120_000 }
  );

  return {
    restoredTables: JSON_TABLES.filter((table) => Array.isArray(data[table.key]) && data[table.key].length > 0).map(
      (table) => table.key
    ),
    createdAt: payload.createdAt ?? null
  };
}

async function deleteBackup(id) {
  const row = await getBackupOrThrow(id);
  try {
    const stat = await fs.stat(row.location);
    if (stat.isDirectory()) {
      await fs.rm(row.location, { recursive: true, force: true });
    } else {
      await fs.unlink(row.location);
    }
  } catch {
    /* file may already be gone */
  }
  await prisma.backupLog.delete({ where: { id } });
  return { id };
}

module.exports = {
  JSON_TABLES,
  createJsonBackup,
  runCsvBackup,
  listBackups,
  getBackupStats,
  getBackup,
  downloadBackup,
  restoreFromPayload,
  parseBackupPayload,
  deleteBackup,
  buildJsonPayload,
  collectJsonData
};
