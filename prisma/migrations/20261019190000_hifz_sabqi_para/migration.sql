-- CreateTable
CREATE TABLE IF NOT EXISTS "HifzSabqiParaSheet" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "fatherName" TEXT NOT NULL DEFAULT '',
    "teacherName" TEXT NOT NULL DEFAULT '',
    "monthLabel" TEXT NOT NULL DEFAULT '',
    "correspondingDate" TEXT NOT NULL DEFAULT '',
    "absence" TEXT NOT NULL DEFAULT '',
    "illness" TEXT NOT NULL DEFAULT '',
    "leaveDays" TEXT NOT NULL DEFAULT '',
    "holidays" TEXT NOT NULL DEFAULT '',
    "totalDuration" TEXT NOT NULL DEFAULT '',
    "remarks" TEXT NOT NULL DEFAULT '',
    "rows" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HifzSabqiParaSheet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "HifzSabqiParaSheet_classId_studentId_key"
  ON "HifzSabqiParaSheet"("classId", "studentId");

CREATE INDEX IF NOT EXISTS "HifzSabqiParaSheet_studentId_idx"
  ON "HifzSabqiParaSheet"("studentId");

CREATE INDEX IF NOT EXISTS "HifzSabqiParaSheet_updatedAt_idx"
  ON "HifzSabqiParaSheet"("updatedAt");
