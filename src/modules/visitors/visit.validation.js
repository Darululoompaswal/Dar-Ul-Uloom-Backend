const { z } = require("zod");

const nullableString = z.string().trim().min(1).optional().nullable();
const nullableDate = z.coerce.date().optional().nullable();
const optional = (schema) => z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const visitFields = z.object({
  visitorName: z.string().trim().min(1),
  visitorRelation: nullableString,
  // Required at API layer; DB columns stay nullable for legacy rows.
  visitorCnic: z.string().trim().min(1),
  visitorAddress: z.string().trim().min(1),
  visitorPhone: nullableString,
  visitDate: z.coerce.date(),
  checkInTime: nullableDate,
  checkOutTime: nullableDate,
  reason: nullableString,
  details: nullableString,
  studentId: z.string().uuid().optional().nullable(),
  teacherId: z.string().uuid().optional().nullable()
});

const idParams = z.object({ id: z.string().uuid() });

const listVisitSchema = z.object({
  body: z.object({}),
  query: z.object({
    page: optional(z.coerce.number().int().min(1)),
    limit: optional(z.coerce.number().int().min(1).max(100)),
    search: optional(z.string().trim()),
    from: optional(z.coerce.date()),
    to: optional(z.coerce.date()),
    studentId: optional(z.string().uuid()),
    teacherId: optional(z.string().uuid())
  }),
  params: z.object({})
});

const visitIdSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: idParams
});

const createVisitSchema = z.object({
  body: visitFields,
  query: z.object({}),
  params: z.object({})
});

const updateVisitSchema = z.object({
  body: visitFields.partial().extend({
    visitorCnic: z.string().trim().min(1),
    visitorAddress: z.string().trim().min(1)
  }),
  query: z.object({}),
  params: idParams
});

module.exports = { listVisitSchema, visitIdSchema, createVisitSchema, updateVisitSchema };
