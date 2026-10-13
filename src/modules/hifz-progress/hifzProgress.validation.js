const { z } = require("zod");

const optional = (schema) => z.preprocess((value) => (value === "" ? undefined : value), schema.optional());
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");
const idParams = z.object({ id: z.string().uuid() });

const rowSchema = z.object({
  id: optional(z.string().trim().min(1)),
  date: z.union([dateString, z.literal("")]).optional().default(""),
  dayLabel: z.string().optional().default(""),
  sabaqPara: z.string().optional().default(""),
  sabaqLines: z.string().optional().default(""),
  sabaqPukhtagi: z.string().optional().default(""),
  sabqiPara: z.string().optional().default(""),
  ghalti: z.string().optional().default(""),
  atkan: z.string().optional().default(""),
  sabqiPukhtagi: z.string().optional().default(""),
  sami: z.string().optional().default("")
});

const sheetBody = z.object({
  classId: z.string().trim().min(1),
  className: z.string().trim().min(1),
  studentId: z.string().trim().min(1),
  studentName: z.string().trim().min(1),
  fatherName: z.string().optional().default(""),
  rows: z.array(rowSchema).default([])
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
    rows: z.array(rowSchema).optional()
  }),
  query: z.object({}),
  params: idParams
});

module.exports = { listSchema, idSchema, createSchema, updateSchema };
