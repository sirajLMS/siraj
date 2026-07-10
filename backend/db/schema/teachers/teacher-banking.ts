import { sql } from "drizzle-orm";
import { boolean, index, numeric, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { encryptedText } from "@/backend/db/schema/custom-types";
import { currencyCodeEnum } from "@/backend/db/schema/enums";
import { teachers } from "@/backend/db/schema/teachers/teachers";
import { users } from "@/backend/db/schema/users/users";
import type { CurrencyCode } from "@/backend/enum";

/**
 * Teacher Banking Details History table.
 * Supports temporal versioning of banking records with admin verification.
 *
 * Database-level Constraints:
 * - Unique Index `teacher_banking_details_history_active_idx`: Enforces at most one active record (where `valid_until IS NULL`) per teacher.
 *
 * Application-layer enforcement (TeacherBankingRepository):
 * - Banking field immutability on active records
 * - Historical record immutability
 * - Admin verification required before real payments
 */
export const teacherBankingDetailsHistory = pgTable(
  "teacher_banking_details_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    // NOTE: The following fields should be encrypted at the application level
    beneficiaryName: encryptedText("beneficiary_name"),
    bankName: encryptedText("bank_name"),
    accountNumber: encryptedText("account_number"),
    routingNumber: encryptedText("routing_number"),
    swiftBic: encryptedText("swift_bic"),
    iban: encryptedText("iban"),
    validFrom: timestamp("valid_from", { withTimezone: true, precision: 3 }).default(sql`clock_timestamp()`).notNull(),
    validUntil: timestamp("valid_until", { withTimezone: true, precision: 3 }),
    verifiedAt: timestamp("verified_at", { withTimezone: true, precision: 3 }),
    verifiedByUserId: uuid("verified_by_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [
    index("teacher_banking_details_history_teacher_id_idx").on(table.teacherId),
    uniqueIndex("teacher_banking_details_history_active_idx")
      .on(table.teacherId)
      .where(sql`${table.validUntil} IS NULL`),
  ]
);

/**
 * Teacher Payments table.
 * Links each disbursement to the specific banking details version used at payment time.
 */
export const teacherPayments = pgTable(
  "teacher_payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "restrict" }),
    bankingDetailsHistoryId: uuid("banking_details_history_id")
      .notNull()
      .references(() => teacherBankingDetailsHistory.id, { onDelete: "restrict" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    currency: currencyCodeEnum("currency").notNull().$type<CurrencyCode>(),
    paymentDate: timestamp("payment_date", { withTimezone: true, precision: 3 }).notNull(),
    isTestPayment: boolean("is_test_payment").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [
    index("teacher_payments_teacher_id_idx").on(table.teacherId),
    index("teacher_payments_banking_details_history_id_idx").on(table.bankingDetailsHistoryId),
  ]
);
