const { z } = require("zod");

const profileFields = z.object({
  nameUr: z.string().optional().default(""),
  nameEn: z.string().optional().default(""),
  addressUr: z.string().optional().default(""),
  addressEn: z.string().optional().default(""),
  affiliationUr: z.string().optional().default(""),
  affiliationEn: z.string().optional().default(""),
  affiliationNumberUr: z.string().optional().default(""),
  affiliationNumberEn: z.string().optional().default("")
});

const getSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: z.object({})
});

const putSchema = z.object({
  body: profileFields,
  query: z.object({}),
  params: z.object({})
});

module.exports = { getSchema, putSchema };
