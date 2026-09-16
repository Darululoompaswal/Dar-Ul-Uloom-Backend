-- AlterTable
ALTER TABLE "SupplyExpense" ADD COLUMN "payDate" DATE,
ADD COLUMN "payerName" TEXT,
ADD COLUMN "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "pendingAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "quantity" DECIMAL(12,2) NOT NULL DEFAULT 1;

-- Backfill pending for existing rows (fully unpaid until paid amounts are entered)
UPDATE "SupplyExpense" SET "pendingAmount" = "amount" WHERE "pendingAmount" = 0 AND "paidAmount" = 0;

-- CreateIndex
CREATE INDEX "SupplyExpense_payDate_idx" ON "SupplyExpense"("payDate");
