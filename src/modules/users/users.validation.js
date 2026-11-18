const { z } = require("zod");

const ASSIGNABLE_ROLES = ["ADMIN", "DATA_ENTRY"];
const LISTABLE_ROLES = ["SUPER_ADMIN", "ADMIN", "DATA_ENTRY", "TEACHER", "VIEWER"];

const optional = (schema) => z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const idParams = z.object({ id: z.string().uuid() });

const listUsersSchema = z.object({
  body: z.object({}),
  query: z.object({
    search: optional(z.string().trim().min(1)),
    role: optional(z.enum(LISTABLE_ROLES)),
    isActive: optional(z.enum(["true", "false"]))
  }),
  params: z.object({})
});

const createUserSchema = z.object({
  body: z.object({
    username: z.string().trim().min(3).max(64),
    fullName: z.string().trim().min(1).max(120),
    password: z.string().min(6).max(128),
    role: z.enum(ASSIGNABLE_ROLES)
  }),
  query: z.object({}),
  params: z.object({})
});

const updateUserSchema = z.object({
  body: z
    .object({
      fullName: optional(z.string().trim().min(1).max(120)),
      username: optional(z.string().trim().min(3).max(64)),
      password: optional(z.string().min(6).max(128)),
      role: optional(z.enum(ASSIGNABLE_ROLES)),
      isActive: optional(z.boolean())
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "At least one field is required"
    }),
  query: z.object({}),
  params: idParams
});

const userIdSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: idParams
});

module.exports = {
  ASSIGNABLE_ROLES,
  listUsersSchema,
  createUserSchema,
  updateUserSchema,
  userIdSchema
};
