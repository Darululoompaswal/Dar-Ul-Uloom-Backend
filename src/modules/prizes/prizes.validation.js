const { z } = require("zod");

const optional = (schema) => z.preprocess((value) => (value === "" ? undefined : value), schema.optional());
const nullableString = z.string().trim().min(1).optional().nullable();
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");
const PRIZE_TYPES = ["CERTIFICATE", "TROPHY", "MEDAL", "SHIELD", "CASH", "OTHER"];
const idParams = z.object({ id: z.string().uuid() });

const prizeFields = z.object({
  studentId: z.string().uuid().optional().nullable(),
  registrationNumber: nullableString,
  studentName: z.string().trim().min(1),
  fatherName: z.string().optional().default(""),
  certificateNo: z.string().trim().min(1),
  departmentId: z.string().trim().min(1),
  departmentName: z.string().trim().min(1),
  prizeWon: z.string().trim().min(1),
  prizeType: z.enum(PRIZE_TYPES),
  prizeTypeOther: nullableString,
  awardedDate: dateString
});

const listSchema = z.object({
  body: z.object({}),
  query: z.object({
    page: optional(z.coerce.number().int().min(1)),
    limit: optional(z.coerce.number().int().min(1).max(100)),
    search: optional(z.string().trim()),
    departmentId: optional(z.string().trim().min(1)),
    prizeType: optional(z.string().trim().min(1)),
    from: optional(dateString),
    to: optional(dateString)
  }),
  params: z.object({})
});

const idSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: idParams
});

const createSchema = z.object({
  body: prizeFields,
  query: z.object({}),
  params: z.object({})
});

const updateSchema = z.object({
  body: prizeFields.partial(),
  query: z.object({}),
  params: idParams
});

module.exports = { listSchema, idSchema, createSchema, updateSchema, PRIZE_TYPES };
