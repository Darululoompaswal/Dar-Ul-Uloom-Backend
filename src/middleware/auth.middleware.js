const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

function extractBearerToken(req) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice(7);
  }
  return null;
}

/**
 * Resolve a JWT from the Authorization header, or (for <img>/<a> tags that
 * cannot send headers) from `?access_token=`.
 */
function extractAccessToken(req) {
  const bearer = extractBearerToken(req);
  if (bearer) return bearer;

  const queryToken = req.query?.access_token;
  if (typeof queryToken === "string" && queryToken.trim()) {
    return queryToken.trim();
  }

  return null;
}

async function loadActiveUser(token) {
  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired authentication token");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, username: true, fullName: true, role: true, isActive: true }
  });

  if (!user || !user.isActive) {
    throw new ApiError(401, "User is inactive or no longer exists");
  }

  return user;
}

const authenticate = asyncHandler(async (req, res, next) => {
  const token = extractBearerToken(req);
  if (!token) {
    throw new ApiError(401, "Authentication token is required");
  }

  req.user = await loadActiveUser(token);
  next();
});

/** Same as authenticate, but also accepts `?access_token=` for file downloads. */
const authenticateFileAccess = asyncHandler(async (req, res, next) => {
  const token = extractAccessToken(req);
  if (!token) {
    throw new ApiError(401, "Authentication token is required");
  }

  req.user = await loadActiveUser(token);
  next();
});

module.exports = { authenticate, authenticateFileAccess, extractAccessToken };
