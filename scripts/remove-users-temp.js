require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const targets = [
  "adepojuadetutu@gmail.com",
  "Adetutu.adepoju@contripay.com",
  "Kayode982@gmail.com",
  "support@champschinhin.com"
].map((t) => t.toLowerCase());

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, fullName: true, role: true, isActive: true }
  });

  console.log("ALL_USERS_COUNT", users.length);
  console.log("ALL_USERS", JSON.stringify(users, null, 2));

  const matches = users.filter((u) => targets.includes((u.username || "").toLowerCase()));
  console.log("EXACT_MATCHES", JSON.stringify(matches, null, 2));

  if (!matches.length) {
    console.log("No matching users found. Nothing deleted.");
    return;
  }

  const ids = matches.map((u) => u.id);
  await prisma.auditLog.updateMany({
    where: { userId: { in: ids } },
    data: { userId: null }
  });

  const result = await prisma.user.deleteMany({ where: { id: { in: ids } } });
  console.log("DELETED_COUNT", result.count);

  const remaining = await prisma.user.findMany({
    select: { username: true, fullName: true, role: true, isActive: true }
  });
  console.log("REMAINING_USERS", JSON.stringify(remaining, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma["$disconnect"]());
