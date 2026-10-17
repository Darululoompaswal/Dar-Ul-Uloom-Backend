const { z } = require("zod");

const optional = (schema) => z.preprocess((value) => (value === "" ? undefined : value), schema.optional());
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");
const idParams = z.object({ id: z.string().uuid() });

const termSchema = z.object({
  term: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  periodFrom: z.union([dateString, z.literal("")]).optional().default(""),
  periodTo: z.union([dateString, z.literal("")]).optional().default(""),
  lessonPosition: z.string().optional().default(""),
  readingAmount: z.string().optional().default(""),
  totalReading: z.string().optional().default(""),
  daysSuspended: z.string().optional().default(""),
  prayerReading: z.string().optional().default(""),
  attendanceTotal: z.string().optional().default(""),
  attendanceAbsent: z.string().optional().default(""),
  attendancePresent: z.string().optional().default(""),
  marksZabt: z.string().optional().default(""),
  marksTajweed: z.string().optional().default(""),
  marksLahja: z.string().optional().default(""),
  marksPrayer: z.string().optional().default(""),
  marksTotal: z.string().optional().default(""),
  remarks: z.string().optional().default("")
});

const annualBody = z.object({
  classId: z.string().trim().min(1),
  className: z.string().trim().min(1),
  studentId: z.string().trim().min(1),
  studentName: z.string().trim().min(1),
  fatherName: z.string().optional().default(""),
  residence: z.string().optional().default(""),
  district: z.string().optional().default(""),
  academicYear: z.string().trim().min(1),
  departmentLabel: z.string().optional().default("شعبہ حفظ"),
  terms: z.array(termSchema).length(3)
});

const listSchema = z.object({
  body: z.object({}),
  query: z.object({
    classId: optional(z.string().trim().min(1)),
    studentId: optional(z.string().trim().min(1)),
    academicYear: optional(z.string().trim().min(1))
  }),
  params: z.object({})
});

const idSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: idParams
});

const createSchema = z.object({
  body: annualBody,
  query: z.object({}),
  params: z.object({})
});

const updateSchema = z.object({
  body: annualBody.partial().extend({
    terms: z.array(termSchema).length(3).optional()
  }),
  query: z.object({}),
  params: idParams
});

module.exports = { listSchema, idSchema, createSchema, updateSchema };
