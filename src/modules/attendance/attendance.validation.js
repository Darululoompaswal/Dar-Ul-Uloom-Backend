const { z } = require("zod");

const attendanceStatus = z.enum(["PRESENT", "ABSENT", "LATE", "LEAVE", "EXCUSED"]);

const upsertSessionSchema = z.object({
  body: z.object({
    departmentId: z.string().uuid(),
    classId: z.string().uuid(),
    date: z.string().min(8),
    sessionType: z.string().optional(),
    entries: z
      .array(
        z.object({
          studentId: z.string().uuid(),
          status: attendanceStatus,
          remarks: z.string().optional().nullable()
        })
      )
      .default([])
  })
});

const sessionQuerySchema = z.object({
  query: z.object({
    classId: z.string().uuid(),
    date: z.string().min(8),
    sessionType: z.string().optional()
  })
});

const listSessionsSchema = z.object({
  query: z.object({
    classId: z.string().uuid().optional(),
    departmentId: z.string().uuid().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional()
  })
});

const sessionIdSchema = z.object({
  params: z.object({ id: z.string().uuid() })
});

module.exports = {
  upsertSessionSchema,
  sessionQuerySchema,
  listSessionsSchema,
  sessionIdSchema
};
