const { z } = require("zod");

const optional = (schema) => z.preprocess((value) => (value === "" ? undefined : value), schema.optional());
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");
const idParams = z.object({ id: z.string().uuid() });

const yearFields = z.object({
  name: z.string().trim().min(1),
  startDate: dateString,
  endDate: dateString,
  isCurrent: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true)
});

const listSchema = z.object({
  body: z.object({}),
  query: z.object({
    includeInactive: optional(z.coerce.boolean())
  }),
  params: z.object({})
});

const idSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: idParams
});

const createSchema = z.object({
  body: yearFields,
  query: z.object({}),
  params: z.object({})
});

const updateSchema = z.object({
  body: yearFields.partial(),
  query: z.object({}),
  params: idParams
});

module.exports = { listSchema, idSchema, createSchema, updateSchema };
