-- CreateTable
CREATE TABLE "FeeRecord" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "month" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "fatherName" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "studentId" TEXT,
    "feeAmount" DECIMAL(12,2) NOT NULL,
    "concessionAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "otherAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeeRecord_date_idx" ON "FeeRecord"("date");

-- CreateIndex
CREATE INDEX "FeeRecord_month_idx" ON "FeeRecord"("month");

-- CreateIndex
CREATE INDEX "FeeRecord_studentName_idx" ON "FeeRecord"("studentName");

-- CreateIndex
CREATE INDEX "FeeRecord_updatedAt_idx" ON "FeeRecord"("updatedAt");
