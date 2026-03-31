import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  fullName: text("full_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "supervisor", "cashier"] }).notNull(),
  branch: text("branch"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: integer("created_by"),
});

// ─── Login Attempts (for rate limiting) ───────────────────────────────────────
export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address").notNull(),
  username: text("username"),
  attemptedAt: timestamp("attempted_at", { withTimezone: true }).defaultNow(),
});

// ─── Reconciliations ─────────────────────────────────────────────────────────
export const reconciliations = pgTable("reconciliations", {
  id: serial("id").primaryKey(),
  cashierId: integer("cashier_id")
    .references(() => users.id)
    .notNull(),
  shiftDate: date("shift_date").notNull(),
  branch: text("branch"),
  status: text("status", {
    enum: ["draft", "submitted", "approved", "disputed"],
  })
    .default("draft")
    .notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  approvedBy: integer("approved_by").references(() => users.id),
  version: integer("version").default(1).notNull(),

  // Dinar denominations (counts only — amounts computed server-side)
  dinar1Count: integer("dinar_1_count").default(0).notNull(),
  dinar5Count: integer("dinar_5_count").default(0).notNull(),
  dinar10Count: integer("dinar_10_count").default(0).notNull(),
  dinar20Count: integer("dinar_20_count").default(0).notNull(),
  dinar50Count: integer("dinar_50_count").default(0).notNull(),

  // Dollar denominations
  dollar1Count: integer("dollar_1_count").default(0).notNull(),
  dollar5Count: integer("dollar_5_count").default(0).notNull(),
  dollar10Count: integer("dollar_10_count").default(0).notNull(),
  dollar20Count: integer("dollar_20_count").default(0).notNull(),
  dollarExchangeRate: integer("dollar_exchange_rate").default(1300).notNull(), // fils per dollar

  // Coins (fils)
  fils100Count: integer("fils_100_count").default(0).notNull(),
  fils250Count: integer("fils_250_count").default(0).notNull(),
  fils500Count: integer("fils_500_count").default(0).notNull(),

  // Electronic payments (stored in fils)
  mepsFils: integer("meps_fils").default(0).notNull(),
  mobiCashFils: integer("mobi_cash_fils").default(0).notNull(),
  networkFils: integer("network_fils").default(0).notNull(),
  arabBankFils: integer("arab_bank_fils").default(0).notNull(),
  creditFils: integer("credit_fils").default(0).notNull(),
  talabatFils: integer("talabat_fils").default(0).notNull(),
  basketFils: integer("basket_fils").default(0).notNull(),
  rajhiFils: integer("rajhi_fils").default(0).notNull(),

  // Miscellaneous
  returnsFils: integer("returns_fils").default(0).notNull(),
  invoiceCashFils: integer("invoice_cash_fils").default(0).notNull(),
  cashDiscountsFils: integer("cash_discounts_fils").default(0).notNull(),

  // System total (from POS)
  systemTotalFils: integer("system_total_fils").default(0).notNull(),

  // Computed server-side and stored
  physicalTotalFils: integer("physical_total_fils").default(0).notNull(),
  differenceFils: integer("difference_fils").default(0).notNull(),
  notes: text("notes"),

  // Soft delete
  isDeleted: boolean("is_deleted").default(false).notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  deletedBy: integer("deleted_by").references(() => users.id),
  deleteReason: text("delete_reason"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Daily Sales ──────────────────────────────────────────────────────────────
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  cashierId: integer("cashier_id").references(() => users.id),
  saleDate: date("sale_date").notNull(),
  totalFils: integer("total_fils").notNull(),
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  deletedBy: integer("deleted_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Vouchers ─────────────────────────────────────────────────────────────────
export const vouchers = pgTable(
  "vouchers",
  {
    id: serial("id").primaryKey(),
    voucherNumber: text("voucher_number").notNull().unique(),
    voucherDate: date("voucher_date").notNull(),
    recipient: text("recipient").notNull(),
    amountDinars: integer("amount_dinars").notNull(),
    amountFils: integer("amount_fils").notNull(), // 0-999
    description: text("description"),
    createdBy: integer("created_by").references(() => users.id),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: integer("deleted_by").references(() => users.id),
    deleteReason: text("delete_reason").default("").notNull(),
    version: integer("version").default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [uniqueIndex("vouchers_number_idx").on(t.voucherNumber)]
);

// ─── Recycle Bin ─────────────────────────────────────────────────────────────
export const recycleBin = pgTable("recycle_bin", {
  id: serial("id").primaryKey(),
  tableName: text("table_name").notNull(),
  recordId: integer("record_id").notNull(),
  deletedBy: integer("deleted_by").references(() => users.id),
  deletedAt: timestamp("deleted_at", { withTimezone: true }).defaultNow(),
  deleteReason: text("delete_reason"),
  restoredBy: integer("restored_by").references(() => users.id),
  restoredAt: timestamp("restored_at", { withTimezone: true }),
  originalData: jsonb("original_data").notNull(),
});

// ─── Audit Log ───────────────────────────────────────────────────────────────
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  tableName: text("table_name"),
  recordId: integer("record_id"),
  oldData: jsonb("old_data"),
  newData: jsonb("new_data"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Types ───────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Reconciliation = typeof reconciliations.$inferSelect;
export type NewReconciliation = typeof reconciliations.$inferInsert;
export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;
export type Voucher = typeof vouchers.$inferSelect;
export type NewVoucher = typeof vouchers.$inferInsert;
export type RecycleBin = typeof recycleBin.$inferSelect;
export type AuditLog = typeof auditLog.$inferSelect;
