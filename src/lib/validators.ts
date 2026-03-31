import { z } from "zod";

const filsField = z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const countField = z.coerce.number().int().min(0).max(9999999);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب").max(100),
  password: z.string().min(1, "كلمة المرور مطلوبة").max(200),
});

// ─── Reconciliation ───────────────────────────────────────────────────────────
export const reconciliationSchema = z.object({
  cashierId: z.coerce.number().int().positive(),
  shiftDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "تاريخ غير صحيح"),
  branch: z.string().max(100).optional(),
  // Dinar denominations
  dinar1Count: countField.default(0),
  dinar5Count: countField.default(0),
  dinar10Count: countField.default(0),
  dinar20Count: countField.default(0),
  dinar50Count: countField.default(0),
  // Dollar denominations
  dollar1Count: countField.default(0),
  dollar5Count: countField.default(0),
  dollar10Count: countField.default(0),
  dollar20Count: countField.default(0),
  dollarExchangeRate: z.coerce.number().int().min(1).max(99999999).default(1300),
  // Coins
  fils100Count: countField.default(0),
  fils250Count: countField.default(0),
  fils500Count: countField.default(0),
  // Electronic payments
  mepsFils: filsField.default(0),
  mobiCashFils: filsField.default(0),
  networkFils: filsField.default(0),
  arabBankFils: filsField.default(0),
  creditFils: filsField.default(0),
  talabatFils: filsField.default(0),
  basketFils: filsField.default(0),
  rajhiFils: filsField.default(0),
  // Miscellaneous
  returnsFils: filsField.default(0),
  invoiceCashFils: filsField.default(0),
  cashDiscountsFils: filsField.default(0),
  // System total
  systemTotalFils: filsField.default(0),
  notes: z.string().max(2000).optional(),
});

export const reconciliationUpdateSchema = reconciliationSchema.extend({
  id: z.coerce.number().int().positive(),
  version: z.coerce.number().int().positive(),
});

// ─── Voucher ──────────────────────────────────────────────────────────────────
export const voucherSchema = z.object({
  voucherDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "تاريخ غير صحيح"),
  recipient: z.string().min(1, "اسم المستلم مطلوب").max(200),
  amountDinars: z.coerce.number().int().min(0),
  amountFils: z.coerce.number().int().min(0).max(999, "الفلوس يجب أن تكون بين 0 و 999"),
  description: z.string().max(2000).optional(),
});

// ─── Soft Delete ──────────────────────────────────────────────────────────────
export const softDeleteSchema = z.object({
  deleteReason: z.string().min(1, "سبب الحذف مطلوب").max(500),
});

// ─── User Management ──────────────────────────────────────────────────────────
export const createUserSchema = z.object({
  username: z.string().min(3, "اسم المستخدم 3 أحرف على الأقل").max(50),
  fullName: z.string().min(1, "الاسم الكامل مطلوب").max(200),
  password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل").max(100),
  role: z.enum(["admin", "supervisor", "cashier"]),
  branch: z.string().max(100).optional(),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(1).max(200),
  role: z.enum(["admin", "supervisor", "cashier"]),
  branch: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "كلمة المرور 8 أحرف على الأقل").max(100),
});

// ─── Report Filters ───────────────────────────────────────────────────────────
export const reportFilterSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  cashierId: z.coerce.number().int().positive().optional(),
});

// ─── Sale ─────────────────────────────────────────────────────────────────────
export const saleSchema = z.object({
  saleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalFils: filsField,
  paymentMethod: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ReconciliationInput = z.infer<typeof reconciliationSchema>;
export type ReconciliationUpdateInput = z.infer<typeof reconciliationUpdateSchema>;
export type VoucherInput = z.infer<typeof voucherSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type SoftDeleteInput = z.infer<typeof softDeleteSchema>;
