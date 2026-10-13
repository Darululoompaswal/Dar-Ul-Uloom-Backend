# Madrassa Management Backend

Offline-first Madrassa Management System backend built with Node.js, Express, PostgreSQL and Prisma.

## Bilingual support

The system is designed for English and Urdu:

- Frontend UI translations should be handled with i18n.
- Database supports Urdu/Unicode values.
- Official system entities can store `nameEn` and `nameUr`.
- Stable codes such as `SCHOOL`, `HIFZ`, and `KUTUB` are used for business logic.
- Student names and father names support separate English and Urdu values.

## Admission structure

A student is stored once and can have multiple admission records over time.

```text
Student
├── Guardians
├── Documents
├── Admissions
├── Enrollments
├── Attendance
└── Status History
```

Each admission records the admission number, registration number, academic year, department, class and previous education details.

## Quick start

```bash
npm install
npx prisma generate
npx prisma migrate dev --name bilingual_admission_update
npm run prisma:seed
npm run dev
```

Health check:

```text
GET /api/health
```

Default seeded administrator:

```text
username: shazi
password: shazi111
```

Change the password immediately after first login.
