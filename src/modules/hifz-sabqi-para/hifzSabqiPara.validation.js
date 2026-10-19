const { z } = require("zod");

const optional = (schema) => z.preprocess((value) => (value === "" ? undefined : value), schema.optional());
const idParams = z.object({ id: z.string().uuid() });

const rowSchema = z.object({
  paraNumber: z.coerce.number().int().min(1).max(30),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  sabqiNama: z.string().optional().default(""),
  ghalti: z.string().optional().default(""),
  atkan: z.string().optional().default(""),
  pukhtagi: z.string().optional().default("")
});

const sheetBody = z.object({
  classId: z.string().trim().min(1),
  className: z.string().trim().min(1),
  studentId: z.string().trim().min(1),
  studentName: z.string().trim().min(1),
  fatherName: z.string().optional().default(""),
  teacherName: z.string().optional().default(""),
  monthLabel: z.string().optional().default(""),
  correspondingDate: z.string().optional().default(""),
  absence: z.string().optional().default(""),
  illness: z.string().optional().default(""),
  leaveDays: z.string().optional().default(""),
  holidays: z.string().optional().default(""),
  totalDuration: z.string().optional().default(""),
  remarks: z.string().optional().default(""),
  rows: z.array(rowSchema).min(1).max(30)
});

const listSchema = z.object({
  body: z.object({}),
  query: z.object({
    classId: optional(z.string().trim().min(1)),
    studentId: optional(z.string().trim().min(1))
  }),
  params: z.object({})
});

const idSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: idParams
});

const createSchema = z.object({
  body: sheetBody,
  query: z.object({}),
  params: z.object({})
});

const updateSchema = z.object({
  body: sheetBody.partial().extend({
    rows: z.array(rowSchema).min(1).max(30).optional()
  }),
  query: z.object({}),
  params: idParams
});

module.exports = { listSchema, idSchema, createSchema, updateSchema };
