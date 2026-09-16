const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../../config/prisma");
const env = require("../../config/env");
const ApiError = require("../../utils/ApiError");

async function login({ username, password }) {
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user || !user.isActive) {
    throw new ApiError(401, "Invalid username or password");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new ApiError(401, "Invalid username or password");

  const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() }
  });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role
    }
  };
}

function serializeUser(user) {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive
  };
}

async function updateProfile(userId, { currentPassword, newUsername, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) {
    throw new ApiError(401, "Unauthorized");
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, "Current password is incorrect");
  }

  const data = {};

  if (newUsername && newUsername !== user.username) {
    const existing = await prisma.user.findUnique({
      where: { username: newUsername },
      select: { id: true }
    });
    if (existing) {
      throw new ApiError(409, "Username is already taken");
    }
    data.username = newUsername;
  }

  if (newPassword) {
    data.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  if (Object.keys(data).length === 0) {
    return serializeUser(user);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data
  });

  return serializeUser(updated);
}

module.exports = { login, updateProfile };
