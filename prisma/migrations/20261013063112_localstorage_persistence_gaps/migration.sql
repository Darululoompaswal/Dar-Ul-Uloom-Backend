-- AlterTable
ALTER TABLE "AttendanceSession" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "CashTransaction" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "KhataEntry" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SalaryRecord" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SupplyExpense" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "finance_inventory_usages" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "finance_sponsors" ADD COLUMN     "address" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'PKR',
ADD COLUMN     "durationMonths" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN     "reference" TEXT,
ADD COLUMN     "startsOn" DATE,
ADD COLUMN     "studentIds" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "studentProfiles" JSONB NOT NULL DEFAULT '{}',
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "HifzProgressSheet" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "fatherName" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HifzProgressSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HifzProgressRow" (
    "id" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "date" DATE,
    "dayLabel" TEXT NOT NULL DEFAULT '',
    "sabaqPara" TEXT NOT NULL DEFAULT '',
    "sabaqLines" TEXT NOT NULL DEFAULT '',
    "sabaqPukhtagi" TEXT NOT NULL DEFAULT '',
    "sabqiPara" TEXT NOT NULL DEFAULT '',
    "ghalti" TEXT NOT NULL DEFAULT '',
    "atkan" TEXT NOT NULL DEFAULT '',
    "sabqiPukhtagi" TEXT NOT NULL DEFAULT '',
    "sami" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "HifzProgressRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamResult" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "fatherName" TEXT NOT NULL DEFAULT '',
    "registrationNumber" TEXT,
    "examName" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "marksObtained" DOUBLE PRECISION NOT NULL,
    "marksMax" DOUBLE PRECISION NOT NULL,
    "grade" TEXT NOT NULL,
    "examDate" DATE NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrizeAward" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "registrationNumber" TEXT,
    "studentName" TEXT NOT NULL,
    "fatherName" TEXT NOT NULL DEFAULT '',
    "certificateNo" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "departmentName" TEXT NOT NULL,
    "prizeWon" TEXT NOT NULL,
    "prizeType" TEXT NOT NULL,
    "prizeTypeOther" TEXT,
    "awardedDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrizeAward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardExam" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "studentName" TEXT NOT NULL,
    "fatherName" TEXT NOT NULL DEFAULT '',
    "registrationNumber" TEXT,
    "className" TEXT,
    "department" TEXT NOT NULL,
    "board" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "examSession" TEXT,
    "result" TEXT NOT NULL DEFAULT 'PENDING',
    "position" TEXT,
    "certificateReceived" BOOLEAN NOT NULL DEFAULT false,
    "degreeReceived" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardRegistration" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "studentName" TEXT NOT NULL,
    "fatherName" TEXT NOT NULL DEFAULT '',
    "registrationNumber" TEXT,
    "className" TEXT,
    "department" TEXT NOT NULL,
    "board" TEXT NOT NULL DEFAULT 'WIFAQ',
    "academicYear" TEXT NOT NULL,
    "studyYear" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "registrationDate" DATE NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassLecture" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "teacherId" TEXT,
    "teacherName" TEXT,
    "dayOfWeek" INTEGER,
    "startTime" TEXT,
    "endTime" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassLecture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "nameUr" TEXT NOT NULL DEFAULT '',
    "nameEn" TEXT NOT NULL DEFAULT '',
    "addressUr" TEXT NOT NULL DEFAULT '',
    "addressEn" TEXT NOT NULL DEFAULT '',
    "affiliationUr" TEXT NOT NULL DEFAULT '',
    "affiliationEn" TEXT NOT NULL DEFAULT '',
    "affiliationNumberUr" TEXT NOT NULL DEFAULT '',
    "affiliationNumberEn" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HifzProgressSheet_studentId_idx" ON "HifzProgressSheet"("studentId");

-- CreateIndex
CREATE INDEX "HifzProgressSheet_updatedAt_idx" ON "HifzProgressSheet"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "HifzProgressSheet_classId_studentId_key" ON "HifzProgressSheet"("classId", "studentId");

-- CreateIndex
CREATE INDEX "HifzProgressRow_sheetId_idx" ON "HifzProgressRow"("sheetId");

-- CreateIndex
CREATE INDEX "ExamResult_classId_idx" ON "ExamResult"("classId");

-- CreateIndex
CREATE INDEX "ExamResult_studentId_idx" ON "ExamResult"("studentId");

-- CreateIndex
CREATE INDEX "ExamResult_examName_idx" ON "ExamResult"("examName");

-- CreateIndex
CREATE INDEX "ExamResult_examDate_idx" ON "ExamResult"("examDate");

-- CreateIndex
CREATE INDEX "ExamResult_updatedAt_idx" ON "ExamResult"("updatedAt");

-- CreateIndex
CREATE INDEX "PrizeAward_departmentId_idx" ON "PrizeAward"("departmentId");

-- CreateIndex
CREATE INDEX "PrizeAward_awardedDate_idx" ON "PrizeAward"("awardedDate");

-- CreateIndex
CREATE INDEX "PrizeAward_updatedAt_idx" ON "PrizeAward"("updatedAt");

-- CreateIndex
CREATE INDEX "BoardExam_department_idx" ON "BoardExam"("department");

-- CreateIndex
CREATE INDEX "BoardExam_board_idx" ON "BoardExam"("board");

-- CreateIndex
CREATE INDEX "BoardExam_result_idx" ON "BoardExam"("result");

-- CreateIndex
CREATE INDEX "BoardExam_academicYear_idx" ON "BoardExam"("academicYear");

-- CreateIndex
CREATE INDEX "BoardExam_updatedAt_idx" ON "BoardExam"("updatedAt");

-- CreateIndex
CREATE INDEX "BoardRegistration_department_idx" ON "BoardRegistration"("department");

-- CreateIndex
CREATE INDEX "BoardRegistration_status_idx" ON "BoardRegistration"("status");

-- CreateIndex
CREATE INDEX "BoardRegistration_academicYear_idx" ON "BoardRegistration"("academicYear");

-- CreateIndex
CREATE INDEX "BoardRegistration_registrationDate_idx" ON "BoardRegistration"("registrationDate");

-- CreateIndex
CREATE INDEX "BoardRegistration_updatedAt_idx" ON "BoardRegistration"("updatedAt");

-- CreateIndex
CREATE INDEX "ClassLecture_classId_idx" ON "ClassLecture"("classId");

-- CreateIndex
CREATE INDEX "ClassLecture_updatedAt_idx" ON "ClassLecture"("updatedAt");

-- AddForeignKey
ALTER TABLE "HifzProgressRow" ADD CONSTRAINT "HifzProgressRow_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "HifzProgressSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassLecture" ADD CONSTRAINT "ClassLecture_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
