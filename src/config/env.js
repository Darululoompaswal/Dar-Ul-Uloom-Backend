const required = ["DATABASE_URL", "JWT_SECRET"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 5000),
  HOST: process.env.HOST || "0.0.0.0",
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  // Comma-separated allowlist. Empty = deny cross-origin in production, reflect in development.
  // Explicit "*" still allows any origin (discouraged).
  CORS_ORIGIN: process.env.CORS_ORIGIN || "",
  BACKUP_DIR: process.env.BACKUP_DIR || "./backups",
  BACKUP_CRON: process.env.BACKUP_CRON || "0 2 * * *",
  SYNC_CRON: process.env.SYNC_CRON || "*/1 * * * *",
  CLOUD_API_URL: process.env.CLOUD_API_URL || "",
  CLOUD_API_KEY: process.env.CLOUD_API_KEY || ""
};
