const { z } = require("zod");

const optional = (schema) => z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const auditActions = ["CREATE", "UPDATE", "DELETE"];

/** Accept staff + finance entity labels; finance role is still filtered in the service. */
const auditEntityTypes = [
  "STUDENT",
  "TEACHER",
  "VISIT",
  "CASH_TRANSACTION",
  "SALARY_RECORD",
  "FEE_RECORD",
  "KHATA_ENTRY",
  "SUPPLY_EXPENSE",
  "FINANCE_INVENTORY",
  "FINANCE_INVENTORY_USAGE",
  "FINANCE_SPONSOR",
  "FINANCE_SPONSOR_PERFORMANCE",
  "BACKUP",
  "BACKUP_RESTORE",
  "USER",
  "CLASS",
  "ACADEMIC_YEAR",
  "ATTENDANCE",
  "PRIZE",
  "BOARD_EXAM",
  "BOARD_REGISTRATION",
  "EXAM_RESULT",
  "CLASS_LECTURE",
  "HIFZ_PROGRESS",
  "INSTITUTION_SETTINGS",
  "TEACHER_ATTENDANCE",
  "ACADEMIC_YEAR_CURRENT",
  "HIFZ_ANNUAL",
  "HIFZ_SABQI_PARA"
];

const listAuditLogSchema = z.object({
  body: z.object({}),
  query: z.object({
    page: optional(z.coerce.number().int().min(1)),
    limit: optional(z.coerce.number().int().min(1).max(100)),
    search: optional(z.string().trim()),
    action: optional(z.enum(auditActions)),
    entityType: optional(z.enum(auditEntityTypes)),
    userId: optional(z.string().uuid()),
    from: optional(z.coerce.date()),
    to: optional(z.coerce.date()),
  }),
  params: z.object({}),
});

module.exports = { listAuditLogSchema, auditActions, auditEntityTypes };
