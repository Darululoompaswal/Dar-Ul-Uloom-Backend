const fs = require("fs/promises");
const path = require("path");
const prisma = require("../config/prisma");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const { exportCsv } = require("./csv.service");

/** Full-system tables (parent→child restore order). */
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
  { key: "feeRecords", model: "feeRecord" },
  { key: "khataEntries", model: "khataEntry" },
  { key: "supplyExpenses", model: "supplyExpense" },
  { key: "financeInventoryItems", model: "financeInventoryItem" },
  { key: "financeInventoryUsages", model: "financeInventoryUsage" },
  { key: "financeSponsors", model: "financeSponsor" }
];

/** Finance-only tables — isolated from full-system backups. */
const FINANCE_TABLES = [
  { key: "cashTransactions", model: "cashTransaction" },
  { key: "salaryRecords", model: "salaryRecord" },
  { key: "feeRecords", model: "feeRecord" },
  { key: "khataEntries", model: "khataEntry" },
  { key: "supplyExpenses", model: "supplyExpense" },
  { key: "financeInventoryItems", model: "financeInventoryItem" },
  { key: "financeInventoryUsages", model: "financeInventoryUsage" },
  { key: "financeSponsors", model: "financeSponsor" }
];

const SCOPE = {
  FULL: {
    id: "FULL",
    kind: "madrassa-backup",
    dirName: "full",
    tables: JSON_TABLES,
    filePrefix: "dup-backup"
  },
  FINANCE: {
    id: "FINANCE",
    kind: "madrassa-finance-backup",
    dirName: "finance",
    tables: FINANCE_TABLES,
    filePrefix: "dup-finance-backup"
  }
};

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
  fee_records: () => prisma.feeRecord.findMany(),
  khata_entries: () => prisma.khataEntry.findMany(),
  supply_expenses: () => prisma.supplyExpense.findMany(),
  finance_inventory_items: () => prisma.financeInventoryItem.findMany(),
  finance_sponsors: () => prisma.financeSponsor.findMany()
};

function resolveScope(scopeId) {
  const key = String(scopeId || "FULL").toUpperCase();
  const scope = SCOPE[key];
  if (!scope) throw new ApiError(400, "Invalid backup scope");
  return scope;
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function normalizePath(location) {
  return String(location || "").replace(/\\/g, "/");
}

function detectScopeFromLocation(location) {
  const normalized = normalizePath(location);
  if (normalized.includes("/finance/")) return "FINANCE";
  return "FULL";
}

function matchesScope(location, scopeId) {
  return detectScopeFromLocation(location) === scopeId;
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

async function collectJsonData(tables) {
  const data = {};
  for (const table of tables) {
    const rows = await prisma[table.model].findMany();
    data[table.key] = rows.map(serializeRow);
  }
  return data;
}

function buildJsonPayload(scope, data) {
  return {
    version: 1,
    kind: scope.kind,
    scope: scope.id,
    createdAt: new Date().toISOString(),
    type: "DATABASE",
    scopes: scope.tables.map((table) => table.key),
    data
  };
}

async function createJsonBackup(scopeId = "FULL") {
  const scope = resolveScope(scopeId);
  const createdAt = new Date().toISOString();
  const folderStamp = stamp();
  const folder = path.resolve(env.BACKUP_DIR, scope.dirName, folderStamp);
  await fs.mkdir(folder, { recursive: true });

  const data = await collectJsonData(scope.tables);
  const payload = buildJsonPayload(scope, data);
  payload.createdAt = createdAt;

  const fileName = `${scope.filePrefix}-${folderStamp}.json`;
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
    error: null,
    scope: scope.id
  };
}

async function runCsvBackup(scopeId = "FULL") {
  const scope = resolveScope(scopeId);
  if (scope.id === "FINANCE") {
    throw new ApiError(400, "CSV backup is only available for full-system backups");
  }

  const directory = path.resolve(env.BACKUP_DIR, scope.dirName, stamp());
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
      exported,
      scope: scope.id
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
    downloadable: isFile || row.type === "DATABASE",
    scope: detectScopeFromLocation(row.location)
  };
}

async function listBackups(scopeId = "FULL") {
  const scope = resolveScope(scopeId);
  const rows = await prisma.backupLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  const items = [];
  for (const row of rows) {
    if (!matchesScope(row.location, scope.id)) continue;
    items.push(serializeBackupLog(row, await pathSize(row.location)));
  }
  return items.slice(0, 50);
}

async function getBackupStats(scopeId = "FULL") {
  const scope = resolveScope(scopeId);
  const rows = await prisma.backupLog.findMany({
    select: { status: true, type: true, createdAt: true, location: true }
  });
  const scoped = rows.filter((row) => matchesScope(row.location, scope.id));
  const successRows = scoped.filter((row) => row.status === "SUCCESS");
  const latest = successRows.sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;

  return {
    total: scoped.length,
    success: successRows.length,
    failed: scoped.filter((row) => row.status === "FAILED").length,
    lastBackupAt: latest?.createdAt?.toISOString() ?? null,
    lastBackupType: latest?.type ?? null,
    scope: scope.id
  };
}

async function getBackupOrThrow(id, scopeId) {
  const row = await prisma.backupLog.findUnique({ where: { id } });
  if (!row) throw new ApiError(404, "Backup not found");
  if (scopeId && !matchesScope(row.location, resolveScope(scopeId).id)) {
    throw new ApiError(404, "Backup not found");
  }
  return row;
}

async function getBackup(id, scopeId) {
  const row = await getBackupOrThrow(id, scopeId);
  return serializeBackupLog(row, await pathSize(row.location));
}

async function resolveDownloadPath(row) {
  const stat = await fs.stat(row.location).catch(() => null);
  if (!stat) throw new ApiError(404, "Backup file is missing on the server");

  if (stat.isFile()) {
    return { filePath: row.location, fileName: path.basename(row.location) };
  }

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

async function downloadBackup(id, scopeId) {
  const row = await getBackupOrThrow(id, scopeId);
  if (row.status !== "SUCCESS") throw new ApiError(400, "Only successful backups can be downloaded");
  return resolveDownloadPath(row);
}

function parseBackupPayload(raw) {
  const payload = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (!payload || payload.version !== 1 || !payload.kind) {
    throw new ApiError(422, "Invalid backup file format");
  }
  if (!payload.data || typeof payload.data !== "object") {
    throw new ApiError(422, "Backup file has no data");
  }
  return payload;
}

function detectScopeFromPayload(payload) {
  if (payload.kind === SCOPE.FINANCE.kind || payload.scope === "FINANCE") return SCOPE.FINANCE;
  if (payload.kind === SCOPE.FULL.kind || payload.scope === "FULL") return SCOPE.FULL;
  throw new ApiError(422, "Unrecognized backup kind");
}

async function restoreFromPayload(payloadInput, expectedScopeId = "FULL") {
  const payload = parseBackupPayload(payloadInput);
  const payloadScope = detectScopeFromPayload(payload);
  const expected = resolveScope(expectedScopeId);

  if (payloadScope.id !== expected.id) {
    throw new ApiError(
      422,
      expected.id === "FINANCE"
        ? "This is a full-system backup. Finance restore only accepts finance backups."
        : "This is a finance-only backup. Full restore only accepts full-system backups."
    );
  }

  const tables = payloadScope.tables;
  const data = payload.data;
  const deleteOrder = [...tables].reverse();

  await prisma.$transaction(
    async (tx) => {
      for (const table of deleteOrder) {
        await tx[table.model].deleteMany({});
      }

      for (const table of tables) {
        const rows = data[table.key];
        if (!Array.isArray(rows) || rows.length === 0) continue;
        await tx[table.model].createMany({ data: rows });
      }
    },
    { timeout: 120_000 }
  );

  return {
    restoredTables: tables
      .filter((table) => Array.isArray(data[table.key]) && data[table.key].length > 0)
      .map((table) => table.key),
    createdAt: payload.createdAt ?? null,
    scope: payloadScope.id
  };
}

async function deleteBackup(id, scopeId) {
  const row = await getBackupOrThrow(id, scopeId);
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
  FINANCE_TABLES,
  SCOPE,
  resolveScope,
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
