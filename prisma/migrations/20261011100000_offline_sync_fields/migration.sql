-- Offline sync prerequisites: updatedAt, deletedAt, version, IdempotencyKey, ClientMutation

ALTER TABLE "Department" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Department_updatedAt_idx" ON "Department"("updatedAt");
CREATE INDEX IF NOT EXISTS "Department_deletedAt_idx" ON "Department"("deletedAt");

ALTER TABLE "AcademicYear" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "AcademicYear_updatedAt_idx" ON "AcademicYear"("updatedAt");
CREATE INDEX IF NOT EXISTS "AcademicYear_deletedAt_idx" ON "AcademicYear"("deletedAt");

ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Student_updatedAt_idx" ON "Student"("updatedAt");
CREATE INDEX IF NOT EXISTS "Student_deletedAt_idx" ON "Student"("deletedAt");

ALTER TABLE "Class" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Class_updatedAt_idx" ON "Class"("updatedAt");
CREATE INDEX IF NOT EXISTS "Class_deletedAt_idx" ON "Class"("deletedAt");

ALTER TABLE "Teacher" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Teacher" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Teacher_updatedAt_idx" ON "Teacher"("updatedAt");
CREATE INDEX IF NOT EXISTS "Teacher_deletedAt_idx" ON "Teacher"("deletedAt");

ALTER TABLE "AttendanceSession" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "AttendanceSession" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "AttendanceSession_updatedAt_idx" ON "AttendanceSession"("updatedAt");
CREATE INDEX IF NOT EXISTS "AttendanceSession_deletedAt_idx" ON "AttendanceSession"("deletedAt");
CREATE INDEX IF NOT EXISTS "AttendanceSession_date_idx" ON "AttendanceSession"("date");

ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "AttendanceRecord_updatedAt_idx" ON "AttendanceRecord"("updatedAt");
CREATE INDEX IF NOT EXISTS "AttendanceRecord_deletedAt_idx" ON "AttendanceRecord"("deletedAt");

ALTER TABLE "CashTransaction" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "CashTransaction" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "CashTransaction" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "CashTransaction_updatedAt_idx" ON "CashTransaction"("updatedAt");
CREATE INDEX IF NOT EXISTS "CashTransaction_deletedAt_idx" ON "CashTransaction"("deletedAt");

ALTER TABLE "SalaryRecord" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS "SalaryRecord_updatedAt_idx" ON "SalaryRecord"("updatedAt");

ALTER TABLE "KhataEntry" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS "KhataEntry_updatedAt_idx" ON "KhataEntry"("updatedAt");

ALTER TABLE "SupplyExpense" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS "SupplyExpense_updatedAt_idx" ON "SupplyExpense"("updatedAt");

ALTER TABLE "finance_inventory_usages" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS "finance_inventory_usages_updatedAt_idx" ON "finance_inventory_usages"("updatedAt");

ALTER TABLE "finance_sponsors" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS "finance_sponsors_updatedAt_idx" ON "finance_sponsors"("updatedAt");

CREATE TABLE IF NOT EXISTS "IdempotencyKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "responseJson" JSONB,
    "statusCode" INTEGER NOT NULL DEFAULT 200,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IdempotencyKey_userId_key_key" ON "IdempotencyKey"("userId", "key");
CREATE INDEX IF NOT EXISTS "IdempotencyKey_createdAt_idx" ON "IdempotencyKey"("createdAt");

CREATE TABLE IF NOT EXISTS "ClientMutation" (
    "id" TEXT NOT NULL,
    "clientMutationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "operation" "SyncOperation" NOT NULL,
    "resultJson" JSONB,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClientMutation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ClientMutation_clientMutationId_key" ON "ClientMutation"("clientMutationId");
CREATE INDEX IF NOT EXISTS "ClientMutation_userId_appliedAt_idx" ON "ClientMutation"("userId", "appliedAt");
CREATE INDEX IF NOT EXISTS "ClientMutation_entityType_entityId_idx" ON "ClientMutation"("entityType", "entityId");
