const { z } = require("zod");

const optional = (schema) => z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const loginSchema = z.object({
  body: z.object({
    username: z.string().min(3),
    password: z.string().min(6)
  }),
  query: z.object({}),
  params: z.object({})
});

const updateProfileSchema = z.object({
  body: z
    .object({
      currentPassword: z.string().min(1),
      newUsername: optional(z.string().trim().min(3)),
      newPassword: optional(z.string().min(6))
    })
    .superRefine((value, ctx) => {
      if (!value.newUsername && !value.newPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["newUsername"],
          message: "Provide a new username and/or new password"
        });
      }
    }),
  query: z.object({}),
  params: z.object({})
});

module.exports = { loginSchema, updateProfileSchema };
