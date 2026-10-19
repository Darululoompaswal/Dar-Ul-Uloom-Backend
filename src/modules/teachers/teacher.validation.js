const { z } = require("zod");

const nullableString = z.string().trim().min(1).optional().nullable();
const nullableDate = z.coerce.date().optional().nullable();
const optional = (schema) => z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const teacherFields = z.object({
  employeeNumber: z.string().trim().min(1),
  firstName: z.string().trim().min(1),
  lastName: nullableString,
  fatherName: nullableString,
  cnic: nullableString,
  phone: nullableString,
  email: z.string().trim().email().optional().nullable(),
  address: nullableString,
  qualification: nullableString,
  subject: nullableString,
  joiningDate: nullableDate,
  status: z.string().trim().min(1).optional(),
  departmentIds: z.array(z.string().uuid()).max(50).optional()
});

const idParams = z.object({ id: z.string().uuid() });

const listTeacherSchema = z.object({
  body: z.object({}),
  query: z.object({
    page: optional(z.coerce.number().int().min(1)),
    limit: optional(z.coerce.number().int().min(1).max(100)),
    search: optional(z.string().trim()),
    status: optional(z.string().trim().min(1)),
    departmentId: optional(z.string().uuid())
  }),
  params: z.object({})
});

const teacherIdSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: idParams
});

const createTeacherSchema = z.object({
  body: teacherFields,
  query: z.object({}),
  params: z.object({})
});

const updateTeacherSchema = z.object({
  body: teacherFields.partial(),
  query: z.object({}),
  params: idParams
});

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");
const attendanceStatuses = ["PRESENT", "ABSENT", "LATE", "LEAVE"];

const listTeacherAttendanceSchema = z.object({
  body: z.object({}),
  query: z.object({
    from: optional(dateString),
    to: optional(dateString)
  }),
  params: idParams
});

const upsertTeacherAttendanceSchema = z.object({
  body: z.object({
    date: dateString,
    status: z.enum(attendanceStatuses),
    remarks: nullableString
  }),
  query: z.object({}),
  params: idParams
});

const deleteTeacherAttendanceSchema = z.object({
  body: z.object({}),
  query: z.object({
    date: dateString
  }),
  params: idParams
});

module.exports = {
  listTeacherSchema,
  teacherIdSchema,
  createTeacherSchema,
  updateTeacherSchema,
  listTeacherAttendanceSchema,
  upsertTeacherAttendanceSchema,
  deleteTeacherAttendanceSchema
};
