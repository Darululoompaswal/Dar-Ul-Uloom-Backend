const { z } = require("zod");

const optional = (schema) => z.preprocess((value) => (value === "" ? undefined : value), schema.optional());
const nullableString = z.string().trim().min(1).optional().nullable();
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");
const idParams = z.object({ id: z.string().uuid() });

const BOARD_AUTHORITIES = ["GUJRANWALA", "WIFAQ"];
const BOARD_DEPARTMENTS = ["SCHOOL", "HIFZ", "KUTUB"];
const BOARD_EXAM_RESULTS = ["PENDING", "PASS", "FAIL", "ABSENT"];
const BOARD_REGISTRATION_STATUSES = ["PENDING", "COMPLETE", "SENT"];
const RELIGIOUS_DEPARTMENTS = ["HIFZ", "KUTUB"];

const examFields = z.object({
  studentId: z.string().uuid().optional().nullable(),
  studentName: z.string().trim().min(1),
  fatherName: z.string().optional().default(""),
  registrationNumber: nullableString,
  className: nullableString,
  department: z.enum(BOARD_DEPARTMENTS),
  board: optional(z.enum(BOARD_AUTHORITIES)),
  academicYear: z.string().trim().min(1),
  examSession: nullableString,
  result: z.enum(BOARD_EXAM_RESULTS),
  position: nullableString,
  certificateReceived: z.boolean().default(false),
  degreeReceived: z.boolean().default(false),
  notes: nullableString
});

const registrationFields = z.object({
  studentId: z.string().uuid().optional().nullable(),
  studentName: z.string().trim().min(1),
  fatherName: z.string().optional().default(""),
  registrationNumber: nullableString,
  className: nullableString,
  department: z.enum(RELIGIOUS_DEPARTMENTS),
  academicYear: z.string().trim().min(1),
  studyYear: z.coerce.number().int().refine((value) => value === 1 || value === 2, {
    message: "studyYear must be 1 or 2"
  }),
  status: z.enum(BOARD_REGISTRATION_STATUSES),
  registrationDate: dateString,
  notes: nullableString
});

const listExamSchema = z.object({
  body: z.object({}),
  query: z.object({
    page: optional(z.coerce.number().int().min(1)),
    limit: optional(z.coerce.number().int().min(1).max(100)),
    search: optional(z.string().trim()),
    department: optional(z.enum(BOARD_DEPARTMENTS)),
    board: optional(z.enum(BOARD_AUTHORITIES)),
    result: optional(z.enum(BOARD_EXAM_RESULTS)),
    academicYear: optional(z.string().trim().min(1))
  }),
  params: z.object({})
});

const listRegistrationSchema = z.object({
  body: z.object({}),
  query: z.object({
    page: optional(z.coerce.number().int().min(1)),
    limit: optional(z.coerce.number().int().min(1).max(100)),
    search: optional(z.string().trim()),
    department: optional(z.enum(RELIGIOUS_DEPARTMENTS)),
    status: optional(z.enum(BOARD_REGISTRATION_STATUSES)),
    studyYear: optional(z.coerce.number().int()),
    academicYear: optional(z.string().trim().min(1))
  }),
  params: z.object({})
});

const idSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: idParams
});

const createExamSchema = z.object({
  body: examFields,
  query: z.object({}),
  params: z.object({})
});

const updateExamSchema = z.object({
  body: examFields.partial(),
  query: z.object({}),
  params: idParams
});

const createRegistrationSchema = z.object({
  body: registrationFields,
  query: z.object({}),
  params: z.object({})
});

const updateRegistrationSchema = z.object({
  body: registrationFields.partial(),
  query: z.object({}),
  params: idParams
});

module.exports = {
  listExamSchema,
  listRegistrationSchema,
  idSchema,
  createExamSchema,
  updateExamSchema,
  createRegistrationSchema,
  updateRegistrationSchema
};
