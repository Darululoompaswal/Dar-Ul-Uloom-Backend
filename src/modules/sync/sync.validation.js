const { z } = require("zod");

const SYNC_ENTITIES = [
  "department",
  "academicYear",
  "class",
  "student",
  "teacher",
  "cashTransaction",
  "attendanceSession",
  "attendanceRecord"
];

const OUTBOX_ENTITY_TYPES = ["student", "teacher", "attendance", "cashTransaction"];

const changesQuerySchema = z.object({
  query: z.object({
    since: z.string().datetime().optional(),
    entities: z.string().optional(),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(500).optional()
  })
});

const outboxBodySchema = z.object({
  body: z.object({
    mutations: z
      .array(
        z.object({
          clientMutationId: z.string().uuid(),
          entityType: z.enum(OUTBOX_ENTITY_TYPES),
          operation: z.enum(["CREATE", "UPDATE", "DELETE"]),
          entityId: z.string().uuid().nullable().optional(),
          baseVersion: z.number().int().nonnegative().optional(),
          payload: z.record(z.any()).default({}),
          occurredAt: z.string().datetime().optional()
        })
      )
      .min(1)
      .max(100)
  })
});

module.exports = {
  SYNC_ENTITIES,
  OUTBOX_ENTITY_TYPES,
  changesQuerySchema,
  outboxBodySchema
};
