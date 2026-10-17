const { z } = require("zod");

const nullableString = z.string().trim().min(1).optional().nullable();
const nullableDate = z.coerce.date().optional().nullable();

const guardianSchema = z.object({
  nameEn: nullableString,
  nameUr: nullableString,
  relationshipEn: nullableString,
  relationshipUr: nullableString,
  phonePrimary: nullableString,
  phoneSecondary: nullableString,
  cnic: nullableString,
  occupation: nullableString,
  address: nullableString,
  isPrimary: z.boolean().optional()
});

const admissionSchema = z.object({
  admissionNumber: z.string().trim().min(1),
  registrationNumber: nullableString,
  admissionDate: z.coerce.date(),
  academicYearId: z.string().uuid(),
  departmentId: z.string().uuid(),
  classId: z.string().uuid().optional().nullable(),
  previousInstitution: nullableString,
  previousClass: nullableString,
  previousEducationDetails: nullableString,
  remarks: nullableString
});

const documentSchema = z.object({
  type: z.enum([
    "STUDENT_PHOTO",
    "B_FORM",
    "CNIC",
    "BIRTH_CERTIFICATE",
    "PREVIOUS_CERTIFICATE",
    "OTHER"
  ]),
  fileName: z.string().min(1),
  fileUrl: z.string().min(1),
  mimeType: nullableString,
  fileSize: z.number().int().nonnegative().optional().nullable()
});

const studentStatusEnum = z.enum([
  "ACTIVE",
  "INACTIVE",
  "EARLY_LEFT",
  "PASSED_OUT",
  "TRANSFERRED",
  "GRADUATED"
]);

const studentFields = z.object({
  registrationNumber: nullableString,

  fullNameEn: nullableString,
  fullNameUr: nullableString,
  fatherNameEn: nullableString,
  fatherNameUr: nullableString,

  dateOfBirth: nullableDate,
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable(),
  status: studentStatusEnum.optional(),

  nationality: nullableString,
  religion: nullableString,

  bFormNumber: nullableString,
  cnicNumber: nullableString,

  phonePrimary: nullableString,
  phoneSecondary: nullableString,
  phoneEmergency: nullableString,
  email: z.string().email().optional().nullable(),

  permanentAddress: nullableString,
  currentAddress: nullableString,
  city: nullableString,
  district: nullableString,

  photoUrl: nullableString,

  /** Optional notes when recording a status change in history */
  statusReason: nullableString,
  statusEffectiveDate: nullableDate,

  guardians: z.array(guardianSchema).max(10).optional(),
  admission: admissionSchema.optional(),
  documents: z.array(documentSchema).max(20).optional()
});

const withStudentNameRules = (schema) => schema.refine(
  (data) => Boolean(data.fullNameEn || data.fullNameUr),
  { message: "At least one student name is required", path: ["fullNameEn"] }
).refine(
  (data) => Boolean(data.fatherNameEn || data.fatherNameUr),
  { message: "At least one father name is required", path: ["fatherNameEn"] }
);

/** On PATCH, only enforce name rules when a name field is present in the payload. */
const withPartialStudentNameRules = (schema) => schema.superRefine((data, ctx) => {
  const touchesStudentName =
    data.fullNameEn !== undefined ||
    data.fullNameUr !== undefined ||
    data.fatherNameEn !== undefined ||
    data.fatherNameUr !== undefined;

  if (!touchesStudentName) return;

  if (!data.fullNameEn && !data.fullNameUr) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "At least one student name is required",
      path: ["fullNameEn"]
    });
  }

  if (!data.fatherNameEn && !data.fatherNameUr) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "At least one father name is required",
      path: ["fatherNameEn"]
    });
  }
});

const createStudentSchema = z.object({
  body: withStudentNameRules(studentFields.extend({ admission: admissionSchema })),
  query: z.object({}),
  params: z.object({})
});

const updateStudentSchema = z.object({
  body: withPartialStudentNameRules(studentFields.partial()),
  query: z.object({}),
  params: z.object({ id: z.string().uuid() })
});

const deleteStudentSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: z.object({ id: z.string().uuid() })
});

const assignClassSchema = z.object({
  body: z.object({
    classId: z.string().uuid().nullable()
  }),
  query: z.object({}),
  params: z.object({ id: z.string().uuid() })
});

const updateAdmissionPlacementSchema = z.object({
  body: z
    .object({
      departmentId: z.string().uuid().optional(),
      academicYearId: z.string().uuid().optional(),
      classId: z.string().uuid().nullable().optional()
    })
    .refine(
      (data) =>
        data.departmentId !== undefined ||
        data.academicYearId !== undefined ||
        data.classId !== undefined,
      { message: "At least one placement field is required" }
    ),
  query: z.object({}),
  params: z.object({ id: z.string().uuid() })
});

module.exports = {
  createStudentSchema,
  updateStudentSchema,
  deleteStudentSchema,
  assignClassSchema,
  updateAdmissionPlacementSchema
};
