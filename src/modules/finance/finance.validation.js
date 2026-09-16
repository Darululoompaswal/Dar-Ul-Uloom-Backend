const { z } = require("zod");

const nullableString = z.string().trim().min(1).optional().nullable();
const optional = (schema) => z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const CASH_TRANSACTION_TYPES = ["IN", "OUT"];
const SALARY_STATUSES = ["PAID", "PENDING"];
const KHATA_ENTRY_TYPES = ["DEBIT", "CREDIT"];
const SUPPLY_CATEGORIES = ["VEGETABLES", "WOOD", "CONSTRUCTION"];

const positiveAmount = z.coerce.number().positive("Amount must be greater than zero");
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");
const monthString = z.string().regex(/^\d{4}-\d{2}$/, "Month must be YYYY-MM");

const idParams = z.object({ id: z.string().uuid() });

const listCashSchema = z.object({
  body: z.object({}),
  query: z.object({
    type: optional(z.enum(CASH_TRANSACTION_TYPES))
  }),
  params: z.object({})
});

const createCashSchema = z.object({
  body: z.object({
    type: z.enum(CASH_TRANSACTION_TYPES),
    amount: positiveAmount,
    date: dateString,
    category: z.string().trim().min(1),
    description: z.string().trim().min(1),
    reference: nullableString
  }),
  query: z.object({}),
  params: z.object({})
});

const listSalarySchema = z.object({
  body: z.object({}),
  query: z.object({
    status: optional(z.enum(SALARY_STATUSES))
  }),
  params: z.object({})
});

const createSalarySchema = z.object({
  body: z.object({
    employeeName: z.string().trim().min(1),
    month: monthString,
    amount: positiveAmount,
    status: z.enum(SALARY_STATUSES).default("PENDING"),
    paidDate: optional(dateString.nullable()),
    notes: nullableString
  }),
  query: z.object({}),
  params: z.object({})
});

const listKhataSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: z.object({})
});

const nonNegativeAmount = z.coerce.number().min(0, "Amount must be zero or greater");
const positiveQuantity = z.coerce.number().positive("Quantity must be greater than zero");

const createKhataSchema = z.object({
  body: z
    .object({
      partyName: z.string().trim().min(1),
      type: z.enum(KHATA_ENTRY_TYPES),
      amount: positiveAmount,
      settledAmount: nonNegativeAmount.default(0),
      date: dateString,
      description: z.string().trim().min(1)
    })
    .superRefine((value, ctx) => {
      if (value.settledAmount > value.amount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["settledAmount"],
          message: "Settled amount cannot exceed total amount"
        });
      }
    }),
  query: z.object({}),
  params: z.object({})
});

const listSupplySchema = z.object({
  body: z.object({}),
  query: z.object({
    category: optional(z.enum(SUPPLY_CATEGORIES))
  }),
  params: z.object({})
});

const createSupplySchema = z.object({
  body: z
    .object({
      category: z.enum(SUPPLY_CATEGORIES),
      amount: positiveAmount,
      date: dateString,
      description: z.string().trim().min(1),
      vendor: nullableString,
      payDate: optional(dateString.nullable()),
      payerName: nullableString,
      paidAmount: nonNegativeAmount.default(0),
      pendingAmount: optional(nonNegativeAmount),
      quantity: positiveQuantity.default(1)
    })
    .superRefine((value, ctx) => {
      if (value.paidAmount > value.amount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["paidAmount"],
          message: "Paid amount cannot exceed total amount"
        });
      }
      if (value.paidAmount > 0 && !value.payDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["payDate"],
          message: "Pay date is required when paid amount is greater than zero"
        });
      }
    }),
  query: z.object({}),
  params: z.object({})
});

const listInventorySchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: z.object({})
});

const createInventorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1),
    quantity: z.coerce.number().int().min(0),
    unit: z.string().trim().min(1).default("pcs"),
    notes: nullableString
  }),
  query: z.object({}),
  params: z.object({})
});

const listSponsorSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: z.object({})
});

const createSponsorSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1),
    phone: nullableString,
    monthlyAmount: positiveAmount,
    studentCount: z.coerce.number().int().min(1).default(1),
    notes: nullableString,
    isActive: z.boolean().default(true)
  }),
  query: z.object({}),
  params: z.object({})
});

const financeIdSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: idParams
});

const updateCashSchema = z.object({
  body: createCashSchema.shape.body,
  query: z.object({}),
  params: idParams
});

const updateSalarySchema = z.object({
  body: createSalarySchema.shape.body,
  query: z.object({}),
  params: idParams
});

const updateKhataSchema = z.object({
  body: createKhataSchema.shape.body,
  query: z.object({}),
  params: idParams
});

const updateSupplySchema = z.object({
  body: createSupplySchema.shape.body,
  query: z.object({}),
  params: idParams
});

const updateInventorySchema = z.object({
  body: createInventorySchema.shape.body,
  query: z.object({}),
  params: idParams
});

const updateSponsorSchema = z.object({
  body: createSponsorSchema.shape.body,
  query: z.object({}),
  params: idParams
});

module.exports = {
  listCashSchema,
  createCashSchema,
  updateCashSchema,
  listSalarySchema,
  createSalarySchema,
  updateSalarySchema,
  listKhataSchema,
  createKhataSchema,
  updateKhataSchema,
  listSupplySchema,
  createSupplySchema,
  updateSupplySchema,
  listInventorySchema,
  createInventorySchema,
  updateInventorySchema,
  listSponsorSchema,
  createSponsorSchema,
  updateSponsorSchema,
  financeIdSchema
};
