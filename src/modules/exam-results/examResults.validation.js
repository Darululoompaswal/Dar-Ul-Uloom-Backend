const { z } = require("zod");

const optional = (schema) => z.preprocess((value) => (value === "" ? undefined : value), schema.optional());
const nullableString = z.string().trim().min(1).optional().nullable();
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");
const idParams = z.object({ id: z.string().uuid() });

const resultFields = z.object({
  classId: z.string().trim().min(1),
  className: z.string().trim().min(1),
  studentId: z.string().trim().min(1),
  studentName: z.string().trim().min(1),
  fatherName: z.string().optional().default(""),
  registrationNumber: nullableString,
  examName: z.string().trim().min(1),
  subject: z.string().trim().min(1),
  marksObtained: z.coerce.number().min(0),
  marksMax: z.coerce.number().positive(),
  grade: z.string().trim().min(1),
  examDate: dateString,
  remarks: nullableString
});

const listSchema = z.object({
  body: z.object({}),
  query: z.object({
    page: optional(z.coerce.number().int().min(1)),
    limit: optional(z.coerce.number().int().min(1).max(100)),
    search: optional(z.string().trim()),
    classId: optional(z.string().trim().min(1)),
    examName: optional(z.string().trim().min(1))
  }),
  params: z.object({})
});

const idSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: idParams
});

const createSchema = z.object({
  body: resultFields,
  query: z.object({}),
  params: z.object({})
});

const updateSchema = z.object({
  body: resultFields.partial(),
  query: z.object({}),
  params: idParams
});

module.exports = { listSchema, idSchema, createSchema, updateSchema };
