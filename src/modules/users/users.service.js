const bcrypt = require("bcryptjs");
const prisma = require("../../config/prisma");
const ApiError = require("../../utils/ApiError");

/** Active finance-seat role (ADMIN). Super Admin is separate and always has finance. */
const FINANCE_SEAT_ROLE = "ADMIN";
const MAX_FINANCE_SEATS = 2;

function serializeUser(user) {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive,
    lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}

async function countFinanceSeats(excludeUserId) {
  return prisma.user.count({
    where: {
      role: FINANCE_SEAT_ROLE,
      isActive: true,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {})
    }
  });
}

async function assertFinanceSeatAvailable(excludeUserId) {
  const used = await countFinanceSeats(excludeUserId);
  if (used >= MAX_FINANCE_SEATS) {
    throw new ApiError(
      409,
      `At most ${MAX_FINANCE_SEATS} finance employees are allowed`
    );
  }
}

async function getSeatSummary() {
  const financeSeatsUsed = await countFinanceSeats();
  return {
    financeSeatsUsed,
    financeSeatsMax: MAX_FINANCE_SEATS,
    financeSeatsRemaining: Math.max(0, MAX_FINANCE_SEATS - financeSeatsUsed)
  };
}

async function listUsers(query = {}) {
  const where = {};

  if (query.role) where.role = query.role;
  if (query.isActive === "true") where.isActive = true;
  if (query.isActive === "false") where.isActive = false;
  if (query.search) {
    where.OR = [
      { username: { contains: query.search, mode: "insensitive" } },
      { fullName: { contains: query.search, mode: "insensitive" } }
    ];
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: [{ role: "asc" }, { fullName: "asc" }]
  });

  const seats = await getSeatSummary();
  return {
    users: users.map(serializeUser),
    seats
  };
}

async function createUser(data) {
  const existing = await prisma.user.findUnique({
    where: { username: data.username },
    select: { id: true }
  });
  if (existing) {
    throw new ApiError(409, "Username is already taken");
  }

  if (data.role === FINANCE_SEAT_ROLE) {
    await assertFinanceSeatAvailable();
  }

  const row = await prisma.user.create({
    data: {
      username: data.username,
      fullName: data.fullName,
      passwordHash: await bcrypt.hash(data.password, 12),
      role: data.role,
      isActive: true
    }
  });

  return serializeUser(row);
}

async function updateUser(id, data, actorId) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role === "SUPER_ADMIN") {
    if (data.role && data.role !== "SUPER_ADMIN") {
      throw new ApiError(403, "Cannot change the Super Admin role");
    }
    if (data.isActive === false) {
      throw new ApiError(403, "Cannot deactivate the Super Admin");
    }
  }

  if (id === actorId && data.isActive === false) {
    throw new ApiError(400, "You cannot deactivate your own account");
  }

  if (data.username && data.username !== user.username) {
    const taken = await prisma.user.findUnique({
      where: { username: data.username },
      select: { id: true }
    });
    if (taken) {
      throw new ApiError(409, "Username is already taken");
    }
  }

  const nextRole = data.role ?? user.role;
  const nextActive = data.isActive ?? user.isActive;
  const willOccupyFinanceSeat = nextRole === FINANCE_SEAT_ROLE && nextActive;
  const currentlyOccupies =
    user.role === FINANCE_SEAT_ROLE && user.isActive;

  if (willOccupyFinanceSeat && !currentlyOccupies) {
    await assertFinanceSeatAvailable(id);
  }

  const updateData = {};
  if (data.fullName !== undefined) updateData.fullName = data.fullName;
  if (data.username !== undefined) updateData.username = data.username;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 12);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData
  });

  return serializeUser(updated);
}

async function deactivateUser(id, actorId) {
  return updateUser(id, { isActive: false }, actorId);
}

module.exports = {
  MAX_FINANCE_SEATS,
  FINANCE_SEAT_ROLE,
  listUsers,
  createUser,
  updateUser,
  deactivateUser,
  getSeatSummary
};
