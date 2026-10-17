const { z } = require("zod");

const optional = (schema) => z.preprocess((value) => (value === "" ? undefined : value), schema.optional());
const nullableString = z.string().trim().min(1).optional().nullable();
const idParams = z.object({ id: z.string().uuid() });
const classIdParams = z.object({ classId: z.string().uuid() });

const lectureBodyBase = z.object({
  subject: z.string().trim().min(1).optional(),
  subjectName: z.string().trim().min(1).optional(),
  teacherId: nullableString,
  teacherName: nullableString,
  dayOfWeek: optional(z.coerce.number().int().min(0).max(6).nullable()),
  startTime: nullableString,
  endTime: nullableString,
  sortOrder: optional(z.coerce.number().int().min(0)),
  isActive: optional(z.boolean())
});

const lectureFields = lectureBodyBase.superRefine((value, ctx) => {
  if (!value.subject && !value.subjectName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["subject"],
      message: "subject is required"
    });
  }

  const start = value.startTime?.trim();
  const end = value.endTime?.trim();
  if ((start && !end) || (!start && end)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [start ? "endTime" : "startTime"],
      message: "Both start and end time are required together"
    });
  }
  if (start && end && end <= start) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endTime"],
      message: "End time must be after start time"
    });
  }
  if (value.teacherId && (!start || !end)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["startTime"],
      message: "Start and end time are required when a teacher is assigned"
    });
  }
});

const listByClassSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: classIdParams
});

const createSchema = z.object({
  body: lectureFields,
  query: z.object({}),
  params: classIdParams
});

const idSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: idParams
});

const updateSchema = z.object({
  body: lectureBodyBase.partial(),
  query: z.object({}),
  params: idParams
});

module.exports = { listByClassSchema, createSchema, idSchema, updateSchema };
