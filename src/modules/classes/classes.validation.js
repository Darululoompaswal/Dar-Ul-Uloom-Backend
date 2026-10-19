const { z } = require("zod");

const optional = (schema) => z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const listClassesSchema = z.object({
  body: z.object({}),
  query: z.object({
    departmentId: z.string().uuid().optional(),
    academicYearId: z.string().uuid().optional(),
    includeInactive: optional(z.coerce.boolean())
  }),
  params: z.object({})
});

const createClassSchema = z.object({
  body: z.object({
    id: z.string().uuid().optional(),
    departmentId: z.string().uuid(),
    academicYearId: z.string().uuid(),
    nameEn: z.string().trim().min(1),
    nameUr: z.string().trim().optional().nullable(),
    code: z.string().trim().optional().nullable(),
    capacity: z.number().int().nonnegative().optional().nullable(),
    classType: z.string().trim().optional().nullable(),
    isActive: z.boolean().optional()
  }),
  query: z.object({}),
  params: z.object({})
});

const updateClassSchema = z.object({
  body: z.object({
    nameEn: z.string().trim().min(1).optional(),
    nameUr: z.string().trim().optional().nullable(),
    code: z.string().trim().optional().nullable(),
    capacity: z.number().int().nonnegative().optional().nullable(),
    classType: z.string().trim().optional().nullable(),
    isActive: z.boolean().optional()
  }),
  query: z.object({}),
  params: z.object({
    id: z.string().uuid()
  })
});

const deleteClassSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: z.object({
    id: z.string().uuid()
  })
});

const classIdSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: z.object({
    id: z.string().uuid()
  })
});

module.exports = {
  listClassesSchema,
  createClassSchema,
  updateClassSchema,
  deleteClassSchema,
  classIdSchema
};
