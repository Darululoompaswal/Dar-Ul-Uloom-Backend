-- CreateTable
CREATE TABLE "HifzAnnualResult" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "fatherName" TEXT NOT NULL DEFAULT '',
    "residence" TEXT NOT NULL DEFAULT '',
    "district" TEXT NOT NULL DEFAULT '',
    "academicYear" TEXT NOT NULL,
    "departmentLabel" TEXT NOT NULL DEFAULT 'شعبہ حفظ',
    "terms" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HifzAnnualResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HifzAnnualResult_studentId_idx" ON "HifzAnnualResult"("studentId");

-- CreateIndex
CREATE INDEX "HifzAnnualResult_academicYear_idx" ON "HifzAnnualResult"("academicYear");

-- CreateIndex
CREATE INDEX "HifzAnnualResult_updatedAt_idx" ON "HifzAnnualResult"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "HifzAnnualResult_classId_studentId_academicYear_key" ON "HifzAnnualResult"("classId", "studentId", "academicYear");
