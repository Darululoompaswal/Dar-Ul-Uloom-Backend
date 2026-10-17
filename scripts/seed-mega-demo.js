/**
 * Mega demo seed for local visualization / QA.
 *
 * Creates (idempotent — clears previous MEGA-* rows first):
 *   - 10 SCHOOL + 5 HIFZ + 3 KUTUB classes
 *   - 35 teachers (assigned to departments + class lectures)
 *   - 500 students with guardians, admissions, enrollments
 *   - ~14 days attendance per class
 *   - Hifz progress sheets (HIFZ students)
 *   - Exam results (all departments)
 *   - 200 prizes
 *   - 50 visitors
 *   - 60 finance sponsors (half sponsor 2+ students) + rich finance activity
 *   - Board exams / registrations
 *
 * Usage (from backend root, local Postgres running):
 *   npm run seed:mega
 */

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();
const PREFIX = "MEGA-";

const COUNTS = {
  schoolClasses: 10,
  hifzClasses: 5,
  kutubClasses: 3,
  teachers: 35,
  students: 500,
  prizes: 200,
  visitors: 50,
  sponsors: 60,
  attendanceDays: 14,
  examResultsPerClass: 8
};

const FIRST_NAMES = [
  "Ahmed", "Hassan", "Usman", "Bilal", "Yusuf", "Hamza", "Omar", "Ibrahim",
  "Zain", "Ali", "Saad", "Fahad", "Tariq", "Imran", "Naveed", "Kashif",
  "Adnan", "Farhan", "Waleed", "Rayyan", "Suleman", "Haroon", "Junaid", "Danish",
  "Ayaan", "Mustafa", "Zubair", "Kamran", "Shahzaib", "Huzaifa"
];
const FATHER_NAMES = [
  "Muhammad", "Abdul", "Ghulam", "Saeed", "Rashid", "Nadeem", "Javed", "Asif",
  "Khalid", "Shahid", "Akram", "Anwar", "Bashir", "Latif", "Majeed", "Qasim",
  "Rafiq", "Saleem", "Tahir", "Zahid", "Arshad", "Faisal", "Hameed", "Iqbal"
];
const TEACHER_FIRST = ["Maulana", "Qari", "Hafiz", "Mufti", "Ustad", "Sheikh"];
const TEACHER_LAST = [
  "Siddiqui", "Farooqi", "Usmani", "Qadri", "Chishti", "Ansari",
  "Hashmi", "Naqvi", "Bukhari", "Gilani", "Kazmi", "Razvi",
  "Madani", "Thanvi", "Dehlvi", "Lahori", "Multani", "Karachi"
];
const CITIES = ["Lahore", "Karachi", "Islamabad", "Faisalabad", "Multan", "Rawalpindi", "Peshawar", "Gujranwala"];

const SCHOOL_SUBJECTS = ["Mathematics", "English", "Urdu", "Science", "Islamiyat", "Pakistan Studies"];
const HIFZ_SUBJECTS = ["Nazira", "Hifz Sabaq", "Sabqi", "Manzil", "Tajweed", "Tarbiyah"];
const KUTUB_SUBJECTS = ["Nahw", "Sarf", "Fiqh", "Hadith", "Tafsir", "Adab"];

const PRIZE_TYPES = ["CERTIFICATE", "TROPHY", "MEDAL", "SHIELD", "CASH", "OTHER"];
const ATTENDANCE_STATUSES = ["PRESENT", "PRESENT", "PRESENT", "PRESENT", "LATE", "ABSENT", "LEAVE"];

function pad(n, width = 3) {
  return String(n).padStart(width, "0");
}

function utcDaysAgo(days) {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - days));
}

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function pick(list, i) {
  return list[Math.abs(i) % list.length];
}

function amount(base, variance, seed) {
  const jitter = ((seed * 37) % (variance * 2 + 1)) - variance;
  return Math.max(100, base + jitter);
}

function cnic(seed) {
  const a = 10000 + (seed % 90000);
  const b = 1000000 + ((seed * 13) % 9000000);
  const c = 1 + (seed % 9);
  return `${a}-${b}-${c}`;
}

function phone(seed) {
  return `03${String(20 + (seed % 70)).padStart(2, "0")}-${String(1000000 + ((seed * 17) % 9000000)).slice(0, 7)}`;
}

async function clearMegaSeed() {
  console.log("Clearing previous MEGA-* data…");

  // Soft-FK / denormalized tables first
  await prisma.attendanceRecord.deleteMany({
    where: { student: { registrationNumber: { startsWith: PREFIX } } }
  });
  await prisma.attendanceSession.deleteMany({
    where: { class: { code: { startsWith: PREFIX } } }
  });

  await prisma.hifzProgressSheet.deleteMany({
    where: { studentId: { in: (await prisma.student.findMany({
      where: { registrationNumber: { startsWith: PREFIX } },
      select: { id: true }
    })).map((s) => s.id) } }
  }).catch(async () => {
    // fallback if no students yet
  });

  const megaStudents = await prisma.student.findMany({
    where: { registrationNumber: { startsWith: PREFIX } },
    select: { id: true }
  });
  const megaStudentIds = megaStudents.map((s) => s.id);
  const megaTeachers = await prisma.teacher.findMany({
    where: { employeeNumber: { startsWith: PREFIX } },
    select: { id: true }
  });
  const megaTeacherIds = megaTeachers.map((t) => t.id);
  const megaClasses = await prisma.class.findMany({
    where: { code: { startsWith: PREFIX } },
    select: { id: true }
  });
  const megaClassIds = megaClasses.map((c) => c.id);

  if (megaStudentIds.length) {
    await prisma.hifzProgressSheet.deleteMany({ where: { studentId: { in: megaStudentIds } } });
    await prisma.examResult.deleteMany({ where: { studentId: { in: megaStudentIds } } });
    await prisma.prizeAward.deleteMany({ where: { studentId: { in: megaStudentIds } } });
    await prisma.boardExam.deleteMany({ where: { studentId: { in: megaStudentIds } } });
    await prisma.boardRegistration.deleteMany({ where: { studentId: { in: megaStudentIds } } });
    await prisma.visit.deleteMany({
      where: {
        OR: [
          { studentId: { in: megaStudentIds } },
          { visitorName: { startsWith: PREFIX } }
        ]
      }
    });
  } else {
    await prisma.prizeAward.deleteMany({ where: { certificateNo: { startsWith: PREFIX } } });
    await prisma.visit.deleteMany({ where: { visitorName: { startsWith: PREFIX } } });
  }

  if (megaTeacherIds.length) {
    await prisma.visit.deleteMany({ where: { teacherId: { in: megaTeacherIds } } });
    await prisma.timetableEntry.deleteMany({ where: { teacherId: { in: megaTeacherIds } } });
  }

  if (megaClassIds.length) {
    await prisma.classLecture.deleteMany({ where: { classId: { in: megaClassIds } } });
    await prisma.examResult.deleteMany({ where: { classId: { in: megaClassIds } } });
  }

  await prisma.financeSponsor.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.cashTransaction.deleteMany({ where: { reference: { startsWith: PREFIX } } });
  await prisma.salaryRecord.deleteMany({ where: { employeeName: { startsWith: PREFIX } } });
  await prisma.khataEntry.deleteMany({ where: { partyName: { startsWith: PREFIX } } });
  await prisma.supplyExpense.deleteMany({ where: { description: { startsWith: PREFIX } } });
  await prisma.financeInventoryUsage.deleteMany({
    where: { item: { name: { startsWith: PREFIX } } }
  });
  await prisma.financeInventoryItem.deleteMany({ where: { name: { startsWith: PREFIX } } });

  await prisma.studentEnrollment.deleteMany({
    where: {
      OR: [
        { student: { registrationNumber: { startsWith: PREFIX } } },
        { class: { code: { startsWith: PREFIX } } }
      ]
    }
  });
  await prisma.studentAdmission.deleteMany({
    where: { admissionNumber: { startsWith: PREFIX } }
  });
  await prisma.student.deleteMany({
    where: { registrationNumber: { startsWith: PREFIX } }
  });
  await prisma.teacher.deleteMany({
    where: { employeeNumber: { startsWith: PREFIX } }
  });
  await prisma.class.deleteMany({
    where: { code: { startsWith: PREFIX } }
  });
}

async function ensureLookups() {
  const departments = [
    { code: "SCHOOL", nameEn: "School", nameUr: "اسکول" },
    { code: "HIFZ", nameEn: "Hifz", nameUr: "حفظ" },
    { code: "KUTUB", nameEn: "Kutub", nameUr: "کتب" }
  ];
  for (const d of departments) {
    await prisma.department.upsert({
      where: { code: d.code },
      update: {},
      create: d
    });
  }

  const year = await prisma.academicYear.upsert({
    where: { name: "2025-2026" },
    update: { isCurrent: true, isActive: true },
    create: {
      name: "2025-2026",
      startDate: new Date("2025-04-01"),
      endDate: new Date("2026-03-31"),
      isCurrent: true,
      isActive: true
    }
  });

  for (const category of [
    { nameEn: "No Leave", nameUr: "بغیر چھٹی" },
    { nameEn: "Competition Winner", nameUr: "مقابلہ جیتنے والا" },
    { nameEn: "Other Prize", nameUr: "دیگر انعام" }
  ]) {
    await prisma.prizeCategory.upsert({
      where: { nameEn: category.nameEn },
      update: category,
      create: category
    });
  }

  const passwordHash = await bcrypt.hash("ketchup_111", 12);
  await prisma.user.upsert({
    where: { username: "shazi" },
    update: { passwordHash, isActive: true },
    create: {
      username: "shazi",
      fullName: "System Administrator",
      passwordHash,
      role: "SUPER_ADMIN"
    }
  });

  await prisma.institutionSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      nameUr: "دار العلوم پسوال",
      nameEn: "Darul Uloom Paswal",
      addressUr: "پسوال، پاکستان",
      addressEn: "Paswal, Pakistan"
    }
  }).catch(() => null);

  const deptRows = await prisma.department.findMany({
    where: { code: { in: ["SCHOOL", "HIFZ", "KUTUB"] } }
  });
  return {
    year,
    byCode: Object.fromEntries(deptRows.map((d) => [d.code, d]))
  };
}

async function createClasses(year, byCode) {
  console.log("Creating classes…");
  const specs = [
    { code: "SCHOOL", count: COUNTS.schoolClasses, prefix: "SCH", subjects: SCHOOL_SUBJECTS },
    { code: "HIFZ", count: COUNTS.hifzClasses, prefix: "HFZ", subjects: HIFZ_SUBJECTS },
    { code: "KUTUB", count: COUNTS.kutubClasses, prefix: "KTB", subjects: KUTUB_SUBJECTS }
  ];

  const classes = [];
  for (const spec of specs) {
    const dept = byCode[spec.code];
    for (let i = 1; i <= spec.count; i += 1) {
      const letter = String.fromCharCode(64 + i); // A, B, …
      const label = spec.code === "SCHOOL" ? "School" : spec.code === "HIFZ" ? "Hifz" : "Kutub";
      const nameEn = `${PREFIX}${label} Class ${letter}`;
      const cls = await prisma.class.create({
        data: {
          departmentId: dept.id,
          academicYearId: year.id,
          nameEn,
          nameUr: `${label} کلاس ${letter}`,
          code: `${PREFIX}${spec.prefix}-${letter}`,
          capacity: 40,
          classType: spec.code,
          isActive: true
        }
      });
      classes.push({ ...cls, departmentCode: spec.code, subjects: spec.subjects, departmentId: dept.id });
    }
  }
  return classes;
}

async function createTeachers(byCode) {
  console.log("Creating teachers…");
  const teachers = [];
  const deptCodes = ["SCHOOL", "HIFZ", "KUTUB"];
  for (let i = 0; i < COUNTS.teachers; i += 1) {
    const deptCode = deptCodes[i % 3];
    const first = pick(TEACHER_FIRST, i);
    const last = pick(TEACHER_LAST, i + 3);
    const teacher = await prisma.teacher.create({
      data: {
        employeeNumber: `${PREFIX}T-${pad(i + 1, 2)}`,
        firstName: first,
        lastName: `${last} ${deptCode}`,
        fatherName: pick(FATHER_NAMES, i),
        cnic: cnic(1000 + i),
        phone: phone(2000 + i),
        email: `teacher${i + 1}@darululoom.local`,
        address: `${pick(CITIES, i)}, Pakistan`,
        joiningDate: utcDaysAgo(400 + i),
        status: "ACTIVE",
        subject: pick(
          deptCode === "SCHOOL" ? SCHOOL_SUBJECTS : deptCode === "HIFZ" ? HIFZ_SUBJECTS : KUTUB_SUBJECTS,
          i
        ),
        qualification: "Alim / Fazil"
      }
    });
    await prisma.teacherDepartment.create({
      data: { teacherId: teacher.id, departmentId: byCode[deptCode].id }
    });
    teachers.push({ ...teacher, departmentCode: deptCode });
  }
  return teachers;
}

async function createLectures(classes, teachers) {
  console.log("Creating lectures…");
  const rows = [];
  /** @type {Map<string, Set<string>>} teacherId → occupied "day|start|end" slots */
  const busy = new Map();
  /** @type {Map<string, number>} teacherId → assigned lecture count (for load balancing) */
  const load = new Map();

  function slotKey(day, start, end) {
    return `${day}|${start}|${end}`;
  }

  function isFree(teacherId, day, start, end) {
    const set = busy.get(teacherId);
    if (!set || !set.size) return true;
    const startM = Number(start.slice(0, 2)) * 60 + Number(start.slice(3, 5));
    const endM = Number(end.slice(0, 2)) * 60 + Number(end.slice(3, 5));
    for (const key of set) {
      const [d, s, e] = key.split("|");
      if (Number(d) !== day) continue;
      const sM = Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
      const eM = Number(e.slice(0, 2)) * 60 + Number(e.slice(3, 5));
      if (startM < eM && sM < endM) return false;
    }
    return true;
  }

  function markBusy(teacherId, day, start, end) {
    if (!busy.has(teacherId)) busy.set(teacherId, new Set());
    busy.get(teacherId).add(slotKey(day, start, end));
    load.set(teacherId, (load.get(teacherId) || 0) + 1);
  }

  /** Prefer free teachers with the fewest lectures so slots spread across the pool. */
  function pickFreeTeacher(pool, day, start, end, preferOffset = 0) {
    const free = pool.filter((t) => isFree(t.id, day, start, end));
    if (!free.length) return null;
    free.sort((a, b) => (load.get(a.id) || 0) - (load.get(b.id) || 0));
    const lightest = load.get(free[0].id) || 0;
    const candidates = free.filter((t) => (load.get(t.id) || 0) === lightest);
    return candidates[preferOffset % candidates.length];
  }

  classes.forEach((cls, classIndex) => {
    const deptTeachers = teachers.filter((t) => t.departmentCode === cls.departmentCode);
    const pool = deptTeachers.length ? deptTeachers : teachers;

    cls.subjects.forEach((subject, idx) => {
      // Stagger day + hour per class so the same subject is not locked to one wall-clock slot.
      const dayOfWeek = (classIndex + idx) % 6;
      const hour = 8 + ((idx + Math.floor(classIndex / 2)) % 7);
      const startTime = `${String(hour).padStart(2, "0")}:00`;
      const endTime = `${String(hour).padStart(2, "0")}:45`;
      const preferOffset = classIndex * cls.subjects.length + idx;

      let teacher = pickFreeTeacher(pool, dayOfWeek, startTime, endTime, preferOffset);
      let finalStart = startTime;
      let finalEnd = endTime;
      let finalDay = dayOfWeek;

      // If the preferred slot is packed, bump hour/day until a free teacher exists.
      let attempts = 0;
      while (!teacher && attempts < 20) {
        attempts += 1;
        const nextHour = 8 + ((hour - 8 + attempts) % 10);
        finalStart = `${String(nextHour).padStart(2, "0")}:00`;
        finalEnd = `${String(nextHour).padStart(2, "0")}:45`;
        finalDay = (dayOfWeek + attempts) % 6;
        teacher = pickFreeTeacher(pool, finalDay, finalStart, finalEnd, preferOffset + attempts);
      }

      if (!teacher) {
        outer: for (let d = 0; d < 6; d += 1) {
          for (let h = 8; h < 18; h += 1) {
            const s = `${String(h).padStart(2, "0")}:00`;
            const e = `${String(h).padStart(2, "0")}:45`;
            const freeTeacher = pickFreeTeacher(pool, d, s, e, preferOffset);
            if (freeTeacher) {
              teacher = freeTeacher;
              finalDay = d;
              finalStart = s;
              finalEnd = e;
              break outer;
            }
          }
        }
      }

      if (!teacher) {
        console.warn(`Skipping lecture "${subject}" for ${cls.code} — no free teacher slot`);
        return;
      }

      markBusy(teacher.id, finalDay, finalStart, finalEnd);
      rows.push({
        classId: cls.id,
        subjectName: subject,
        teacherId: teacher.id,
        teacherName: `${teacher.firstName} ${teacher.lastName || ""}`.trim(),
        dayOfWeek: finalDay,
        startTime: finalStart,
        endTime: finalEnd,
        sortOrder: idx,
        isActive: true
      });
    });
  });

  await prisma.classLecture.createMany({ data: rows });
  return rows.length;
}

async function createStudents(classes, year) {
  console.log("Creating students, guardians, admissions, enrollments…");
  const perClass = Math.floor(COUNTS.students / classes.length);
  let remainder = COUNTS.students - perClass * classes.length;
  const allStudents = [];
  let globalIndex = 0;

  for (const cls of classes) {
    const count = perClass + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;

    for (let i = 0; i < count; i += 1) {
      globalIndex += 1;
      const first = pick(FIRST_NAMES, globalIndex);
      const father = pick(FATHER_NAMES, globalIndex + 5);
      const reg = `${PREFIX}${cls.departmentCode.slice(0, 3)}-R${pad(globalIndex, 4)}`;
      const admissionNo = `${PREFIX}ADM-${pad(globalIndex, 4)}`;

      const student = await prisma.student.create({
        data: {
          registrationNumber: reg,
          fullNameEn: `${first} ${father}`,
          fullNameUr: `${first} ${father}`,
          fatherNameEn: father,
          fatherNameUr: father,
          dateOfBirth: utcDaysAgo(4000 + (globalIndex % 2000)),
          gender: "MALE",
          nationality: "Pakistani",
          religion: "Islam",
          bFormNumber: `B-${100000 + globalIndex}`,
          phonePrimary: phone(3000 + globalIndex),
          permanentAddress: `${pick(CITIES, globalIndex)}`,
          currentAddress: `${pick(CITIES, globalIndex + 1)}`,
          city: pick(CITIES, globalIndex),
          district: pick(CITIES, globalIndex + 2),
          status: "ACTIVE"
        }
      });

      await prisma.guardian.create({
        data: {
          studentId: student.id,
          nameEn: father,
          nameUr: father,
          relationshipEn: "Father",
          relationshipUr: "والد",
          phonePrimary: phone(4000 + globalIndex),
          cnic: cnic(5000 + globalIndex),
          isPrimary: true,
          address: pick(CITIES, globalIndex)
        }
      });

      await prisma.studentAdmission.create({
        data: {
          studentId: student.id,
          admissionNumber: admissionNo,
          registrationNumber: reg,
          admissionDate: utcDaysAgo(200 + (globalIndex % 100)),
          academicYearId: year.id,
          departmentId: cls.departmentId,
          classId: cls.id,
          status: "ACTIVE"
        }
      });

      await prisma.studentEnrollment.create({
        data: {
          studentId: student.id,
          departmentId: cls.departmentId,
          classId: cls.id,
          academicYearId: year.id,
          rollNumber: String(i + 1),
          status: "ACTIVE"
        }
      });

      allStudents.push({
        ...student,
        classId: cls.id,
        className: cls.nameEn,
        departmentId: cls.departmentId,
        departmentCode: cls.departmentCode,
        fatherName: father,
        registrationNumber: reg
      });
    }
  }
  return allStudents;
}

async function createAttendance(classes, students) {
  console.log("Creating attendance…");
  let sessions = 0;
  let records = 0;

  for (const cls of classes) {
    const classStudents = students.filter((s) => s.classId === cls.id);
    for (let day = COUNTS.attendanceDays - 1; day >= 0; day -= 1) {
      const date = utcDaysAgo(day);
      if (date.getUTCDay() === 0) continue; // skip Sundays
      const session = await prisma.attendanceSession.create({
        data: {
          departmentId: cls.departmentId,
          classId: cls.id,
          date,
          sessionType: "DAILY"
        }
      });
      sessions += 1;
      const batch = classStudents.map((s, idx) => ({
        attendanceSessionId: session.id,
        studentId: s.id,
        status: pick(ATTENDANCE_STATUSES, day + idx),
        remarks: null
      }));
      await prisma.attendanceRecord.createMany({ data: batch });
      records += batch.length;
    }
  }
  return { sessions, records };
}

async function createHifzProgress(students) {
  console.log("Creating Hifz progress sheets…");
  const hifzStudents = students.filter((s) => s.departmentCode === "HIFZ");
  let count = 0;
  for (const s of hifzStudents) {
    const rows = [];
    for (let r = 0; r < 10; r += 1) {
      rows.push({
        date: utcDaysAgo(r + 1),
        dayLabel: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][r % 7],
        sabaqPara: String(1 + (r % 30)),
        sabaqLines: String(5 + (r % 10)),
        sabaqPukhtagi: pick(["اچھی", "متوسط", "کمزور"], r),
        sabqiPara: String(1 + ((r + 1) % 30)),
        ghalti: String(r % 4),
        atkan: String(r % 3),
        sabqiPukhtagi: pick(["اچھی", "متوسط"], r + 1),
        sami: pick(["OK", "Needs work", ""], r),
        sortOrder: r
      });
    }
    await prisma.hifzProgressSheet.create({
      data: {
        classId: s.classId,
        className: s.className,
        studentId: s.id,
        studentName: s.fullNameEn || "Student",
        fatherName: s.fatherName || "",
        rows: { create: rows }
      }
    });
    count += 1;
  }
  return count;
}

async function createExamResults(classes, students) {
  console.log("Creating exam results…");
  const rows = [];
  const exams = ["Mid Term", "Final Term", "Monthly Test"];
  for (const cls of classes) {
    const classStudents = students.filter((s) => s.classId === cls.id);
    const sample = classStudents.slice(0, Math.min(COUNTS.examResultsPerClass, classStudents.length));
    sample.forEach((s, idx) => {
      const max = 100;
      const obtained = 45 + ((idx * 7 + cls.nameEn.length) % 55);
      const grade = obtained >= 85 ? "A" : obtained >= 70 ? "B" : obtained >= 55 ? "C" : "D";
      rows.push({
        classId: cls.id,
        className: cls.nameEn,
        studentId: s.id,
        studentName: s.fullNameEn || "Student",
        fatherName: s.fatherName || "",
        registrationNumber: s.registrationNumber,
        examName: pick(exams, idx),
        subject: pick(cls.subjects, idx),
        marksObtained: obtained,
        marksMax: max,
        grade,
        examDate: utcDaysAgo(20 + idx),
        remarks: obtained < 55 ? "Needs improvement" : null
      });
    });
  }
  // createMany in chunks
  for (let i = 0; i < rows.length; i += 100) {
    await prisma.examResult.createMany({ data: rows.slice(i, i + 100) });
  }
  return rows.length;
}

async function createPrizes(students, byCode) {
  console.log("Creating prizes…");
  const rows = [];
  for (let i = 0; i < COUNTS.prizes; i += 1) {
    const s = pick(students, i * 3);
    const dept = byCode[s.departmentCode];
    const prizeType = pick(PRIZE_TYPES, i);
    rows.push({
      studentId: s.id,
      registrationNumber: s.registrationNumber,
      studentName: s.fullNameEn || "Student",
      fatherName: s.fatherName || "",
      certificateNo: `${PREFIX}CERT-${pad(i + 1, 4)}`,
      departmentId: dept.id,
      departmentName: dept.nameEn,
      prizeWon: pick(
        ["Qirat Winner", "No Leave Award", "Top of Class", "Sports Champion", "Essay Contest", "Hifz Milestone"],
        i
      ),
      prizeType,
      prizeTypeOther: prizeType === "OTHER" ? "Special Recognition" : null,
      awardedDate: utcDaysAgo(5 + (i % 60))
    });
  }
  for (let i = 0; i < rows.length; i += 100) {
    await prisma.prizeAward.createMany({ data: rows.slice(i, i + 100) });
  }
  return rows.length;
}

async function createVisitors(students, teachers) {
  console.log("Creating visitors…");
  const rows = [];
  for (let i = 0; i < COUNTS.visitors; i += 1) {
    const visitStudent = i % 3 !== 0;
    const s = pick(students, i * 2);
    const t = pick(teachers, i);
    rows.push({
      studentId: visitStudent ? s.id : null,
      teacherId: visitStudent ? null : t.id,
      visitorName: `${PREFIX}Visitor ${pick(FIRST_NAMES, i)} ${pick(FATHER_NAMES, i + 2)}`,
      visitorCnic: cnic(7000 + i),
      visitorAddress: `${pick(CITIES, i)}, Pakistan`,
      visitorPhone: phone(8000 + i),
      visitDate: utcDaysAgo(i % 40),
      checkInTime: utcDaysAgo(i % 40),
      reason: pick(["Family visit", "Fee inquiry", "Pickup", "Meeting teacher", "Donation"], i),
      details: "Seeded visitor record",
      visitorRelation: pick(["Father", "Uncle", "Brother", "Guardian"], i)
    });
  }
  await prisma.visit.createMany({ data: rows });
  return rows.length;
}

async function createBoard(students) {
  console.log("Creating board exams & registrations…");
  const hifzKutub = students.filter((s) => s.departmentCode === "HIFZ" || s.departmentCode === "KUTUB");
  const school = students.filter((s) => s.departmentCode === "SCHOOL");

  const exams = [];
  const sample = [...hifzKutub.slice(0, 40), ...school.slice(0, 20)];
  sample.forEach((s, i) => {
    exams.push({
      studentId: s.id,
      studentName: s.fullNameEn || "Student",
      fatherName: s.fatherName || "",
      registrationNumber: s.registrationNumber,
      className: s.className,
      department: s.departmentCode,
      board: s.departmentCode === "SCHOOL" ? "GUJRANWALA" : "WIFAQ",
      academicYear: "2025-2026",
      examSession: pick(["Annual", "Supplementary"], i),
      result: pick(["PENDING", "PASS", "PASS", "FAIL", "ABSENT"], i),
      position: i % 5 === 0 ? String(1 + (i % 10)) : null,
      certificateReceived: i % 4 === 0,
      degreeReceived: i % 7 === 0,
      notes: null
    });
  });
  await prisma.boardExam.createMany({ data: exams });

  const regs = hifzKutub.slice(0, 35).map((s, i) => ({
    studentId: s.id,
    studentName: s.fullNameEn || "Student",
    fatherName: s.fatherName || "",
    registrationNumber: s.registrationNumber,
    className: s.className,
    department: s.departmentCode === "KUTUB" ? "KUTUB" : "HIFZ",
    board: "WIFAQ",
    academicYear: "2025-2026",
    studyYear: (i % 2) + 1,
    status: pick(["PENDING", "COMPLETE", "SENT"], i),
    registrationDate: utcDaysAgo(30 + i),
    notes: null
  }));
  await prisma.boardRegistration.createMany({ data: regs });

  return { exams: exams.length, registrations: regs.length };
}

async function createFinance(students, teachers) {
  console.log("Creating finance data…");
  const thisMonth = monthKey();

  // Cash — ~30 days
  const cashRows = [];
  const incomeCats = ["Donation", "Fees", "Sponsorship", "Zakat", "Sadaqah"];
  const expenseCats = ["Utilities", "Maintenance", "Kitchen", "Transport", "Stationery", "Medical"];
  for (let day = 29; day >= 0; day -= 1) {
    const date = utcDaysAgo(day);
    cashRows.push({
      type: "IN",
      amount: amount(15000, 8000, day * 3),
      date,
      category: pick(incomeCats, day),
      description: `${PREFIX}Daily income`,
      reference: `${PREFIX}IN-${pad(day, 2)}`
    });
    cashRows.push({
      type: "OUT",
      amount: amount(7000, 3000, day * 5),
      date,
      category: pick(expenseCats, day + 1),
      description: `${PREFIX}Daily expense`,
      reference: `${PREFIX}OUT-${pad(day, 2)}`
    });
  }
  await prisma.cashTransaction.createMany({ data: cashRows });

  // Salaries for first 20 teachers
  const salaryRows = teachers.slice(0, 20).map((t, i) => ({
    employeeName: `${PREFIX}${t.firstName} ${t.lastName || ""}`.trim(),
    month: thisMonth,
    amount: amount(30000, 10000, i * 11),
    status: i % 3 === 0 ? "PENDING" : "PAID",
    paidDate: i % 3 === 0 ? null : utcDaysAgo(3 + (i % 5)),
    notes: i % 3 === 0 ? "Awaiting approval" : null
  }));
  await prisma.salaryRecord.createMany({ data: salaryRows });

  // Khata
  const parties = ["Al-Rahman Traders", "City Hardware", "Green Farm Dairy", "Noor Book House", "BuildMart"];
  const khataRows = [];
  for (let i = 0; i < 24; i += 1) {
    const party = `${PREFIX}${pick(parties, i)}`;
    khataRows.push({
      partyName: party,
      type: "CREDIT",
      amount: amount(10000, 4000, i * 7),
      settledAmount: amount(3000, 1500, i * 9),
      date: utcDaysAgo(2 + i),
      description: `${PREFIX}Goods on credit`
    });
    if (i % 2 === 0) {
      khataRows.push({
        partyName: party,
        type: "DEBIT",
        amount: amount(5000, 2000, i * 11),
        settledAmount: amount(2000, 800, i * 13),
        date: utcDaysAgo(i),
        description: `${PREFIX}Partial settlement`
      });
    }
  }
  await prisma.khataEntry.createMany({ data: khataRows });

  // Supplies
  const supplyRows = [];
  for (let day = 0; day < 20; day += 1) {
    if (day % 2 === 0) {
      supplyRows.push({
        category: "VEGETABLES",
        amount: amount(6000, 1500, day),
        date: utcDaysAgo(day),
        description: `${PREFIX}Weekly vegetables`,
        vendor: "Sabzi Mandi",
        quantity: amount(20, 5, day),
        paidAmount: amount(4000, 1000, day),
        pendingAmount: amount(1500, 500, day + 1)
      });
    }
    if (day % 5 === 0) {
      supplyRows.push({
        category: "WOOD",
        amount: amount(12000, 3000, day),
        date: utcDaysAgo(day),
        description: `${PREFIX}Firewood`,
        vendor: "Timber Depot",
        quantity: 1,
        paidAmount: amount(10000, 2000, day),
        pendingAmount: 0
      });
    }
    if (day % 7 === 0) {
      supplyRows.push({
        category: "CONSTRUCTION",
        amount: amount(25000, 5000, day),
        date: utcDaysAgo(day),
        description: `${PREFIX}Repair materials`,
        vendor: "BuildMart",
        quantity: 1,
        paidAmount: amount(15000, 4000, day),
        pendingAmount: amount(8000, 2000, day)
      });
    }
  }
  await prisma.supplyExpense.createMany({ data: supplyRows });

  // Inventory + usage
  const itemDefs = [
    { name: `${PREFIX}Rice (bags)`, quantity: 80, unit: "bags" },
    { name: `${PREFIX}Cooking oil`, quantity: 40, unit: "litres" },
    { name: `${PREFIX}Prayer mats`, quantity: 150, unit: "pcs" },
    { name: `${PREFIX}Flour (bags)`, quantity: 35, unit: "bags" },
    { name: `${PREFIX}Sugar`, quantity: 25, unit: "kg" },
    { name: `${PREFIX}Blankets`, quantity: 90, unit: "pcs" },
    { name: `${PREFIX}Gas cylinders`, quantity: 12, unit: "pcs" },
    { name: `${PREFIX}Cleaning kits`, quantity: 30, unit: "kits" }
  ];
  for (const def of itemDefs) {
    const item = await prisma.financeInventoryItem.create({ data: def });
    for (let d = 0; d < 10; d += 1) {
      const qty = 1 + (d % 3);
      if (item.quantity <= qty) break;
      await prisma.financeInventoryUsage.create({
        data: {
          itemId: item.id,
          quantity: qty,
          date: utcDaysAgo(d),
          notes: `${PREFIX}Daily usage`
        }
      });
      await prisma.financeInventoryItem.update({
        where: { id: item.id },
        data: { quantity: { decrement: qty } }
      });
    }
  }

  // Sponsors — 60, half with 2+ students
  const multiCount = Math.floor(COUNTS.sponsors / 2);
  for (let i = 0; i < COUNTS.sponsors; i += 1) {
    const multi = i < multiCount;
    const studentCount = multi ? 2 + (i % 3) : 1; // 2–4 or 1
    const assigned = [];
    for (let j = 0; j < studentCount; j += 1) {
      assigned.push(pick(students, i * 5 + j * 11));
    }
    const uniqueAssigned = [...new Map(assigned.map((s) => [s.id, s])).values()].slice(0, studentCount);
    const studentIds = uniqueAssigned.map((s) => s.id);
    const studentProfiles = {};
    for (const s of uniqueAssigned) {
      studentProfiles[s.id] = {
        studentId: s.id,
        expenditureEducation: String(amount(4000, 1000, i)),
        expenditureFood: String(amount(3000, 800, i + 1)),
        expenditureDress: String(amount(1500, 400, i + 2)),
        expenditureOther: "",
        expenditurePrize: i % 4 === 0 ? String(amount(2000, 500, i)) : "",
        firstTermIslamicSubject: "Quran",
        firstTermIslamicPerformance: pick(["A", "B", "C"], i),
        firstTermSecularSubject: "Math",
        firstTermSecularPerformance: pick(["A", "B"], i + 1),
        annualIslamicSubject: "Hadith",
        annualIslamicPerformance: pick(["A", "B"], i + 2),
        annualSecularSubject: "Urdu",
        annualSecularPerformance: pick(["A", "B", "C"], i + 3),
        sportsType: pick(["Cricket", "Football", ""], i),
        sportsPerformance: pick(["Good", "Average", ""], i),
        bazamType: "",
        bazamPerformance: "",
        computerType: pick(["Basic", ""], i),
        computerPerformance: pick(["Good", ""], i),
        updatedAt: new Date().toISOString()
      };
    }

    await prisma.financeSponsor.create({
      data: {
        name: `${PREFIX}Sponsor ${pick(FIRST_NAMES, i)} ${pick(FATHER_NAMES, i + 4)}`,
        phone: phone(9000 + i),
        address: `${pick(CITIES, i)}, Pakistan`,
        monthlyAmount: amount(20000, 10000, i * 3),
        currency: pick(["PKR", "PKR", "PKR", "USD", "GBP"], i),
        studentCount: studentIds.length,
        studentIds,
        durationMonths: pick([6, 12, 24], i),
        startsOn: utcDaysAgo(60 + i),
        reference: `${PREFIX}REF-${pad(i + 1, 3)}`,
        notes: multi ? "Multi-student sponsorship" : "Single student",
        studentProfiles,
        isActive: i % 10 !== 9
      }
    });
  }

  return {
    cash: cashRows.length,
    salaries: salaryRows.length,
    khata: khataRows.length,
    supplies: supplyRows.length,
    inventory: itemDefs.length,
    sponsors: COUNTS.sponsors,
    multiSponsors: multiCount
  };
}

async function main() {
  console.log("=== MEGA DEMO SEED ===");
  console.log(`Target DB: ${process.env.DATABASE_URL ? "DATABASE_URL set" : "MISSING DATABASE_URL"}`);

  await clearMegaSeed();
  const { year, byCode } = await ensureLookups();

  const classes = await createClasses(year, byCode);
  const teachers = await createTeachers(byCode);
  const lectureCount = await createLectures(classes, teachers);
  const students = await createStudents(classes, year);
  const attendance = await createAttendance(classes, students);
  const hifzSheets = await createHifzProgress(students);
  const examResults = await createExamResults(classes, students);
  const prizes = await createPrizes(students, byCode);
  const visitors = await createVisitors(students, teachers);
  const board = await createBoard(students);
  const finance = await createFinance(students, teachers);

  console.log("\n=== DONE ===");
  console.log(`  Classes           : ${classes.length} (SCHOOL ${COUNTS.schoolClasses}, HIFZ ${COUNTS.hifzClasses}, KUTUB ${COUNTS.kutubClasses})`);
  console.log(`  Teachers          : ${teachers.length}`);
  console.log(`  Lectures          : ${lectureCount}`);
  console.log(`  Students          : ${students.length}`);
  console.log(`  Attendance sess.  : ${attendance.sessions} (${attendance.records} records)`);
  console.log(`  Hifz sheets       : ${hifzSheets}`);
  console.log(`  Exam results      : ${examResults}`);
  console.log(`  Prizes            : ${prizes}`);
  console.log(`  Visitors          : ${visitors}`);
  console.log(`  Board exams       : ${board.exams}`);
  console.log(`  Board regs        : ${board.registrations}`);
  console.log(`  Cash txns         : ${finance.cash}`);
  console.log(`  Salaries          : ${finance.salaries}`);
  console.log(`  Khata             : ${finance.khata}`);
  console.log(`  Supplies          : ${finance.supplies}`);
  console.log(`  Inventory items   : ${finance.inventory}`);
  console.log(`  Sponsors          : ${finance.sponsors} (${finance.multiSponsors} multi-student)`);
  console.log("\nLogin: shazi / ketchup_111");
  console.log("Re-run safely anytime — previous MEGA-* rows are cleared first.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
