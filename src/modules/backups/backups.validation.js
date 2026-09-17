const { z } = require("zod");

const idParams = z.object({ id: z.string().uuid() });

const listBackupsSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: z.object({})
});

const createBackupSchema = z.object({
  body: z.object({
    type: z.enum(["DATABASE", "CSV"]).optional().default("DATABASE")
  }),
  query: z.object({}),
  params: z.object({})
});

const backupIdSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: idParams
});

module.exports = {
  listBackupsSchema,
  createBackupSchema,
  backupIdSchema
};
