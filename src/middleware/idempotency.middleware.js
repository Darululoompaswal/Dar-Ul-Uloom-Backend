const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Honors `Idempotency-Key` on mutating requests.
 * Replays the stored JSON body/status when the same user+key is seen again.
 */
function idempotency() {
  return asyncHandler(async (req, res, next) => {
    const key = req.get("Idempotency-Key")?.trim();
    if (!key || !req.user?.id) {
      return next();
    }

    const existing = await prisma.idempotencyKey.findUnique({
      where: { userId_key: { userId: req.user.id, key } }
    });

    if (existing) {
      return res.status(existing.statusCode || 200).json(existing.responseJson);
    }

    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      try {
        await prisma.idempotencyKey.create({
          data: {
            key,
            userId: req.user.id,
            method: req.method,
            path: req.originalUrl,
            responseJson: body,
            statusCode: res.statusCode || 200
          }
        });
      } catch (_) {
        // Unique race: another request stored first — still return our body.
      }
      return originalJson(body);
    };

    return next();
  });
}

module.exports = idempotency;
