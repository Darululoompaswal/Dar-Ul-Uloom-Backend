-- AlterTable
ALTER TABLE "CashTransaction" ADD COLUMN IF NOT EXISTS "receiptNumber" TEXT;
ALTER TABLE "CashTransaction" ADD COLUMN IF NOT EXISTS "donorName" TEXT;
ALTER TABLE "CashTransaction" ADD COLUMN IF NOT EXISTS "donorAddress" TEXT;
ALTER TABLE "CashTransaction" ADD COLUMN IF NOT EXISTS "billNumber" TEXT;
ALTER TABLE "CashTransaction" ADD COLUMN IF NOT EXISTS "paidBy" TEXT;
