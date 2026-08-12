import { boolean, index, jsonb, numeric, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { userPaymentMethods } from "@/backend/db/schema/billing/user-payment-methods";
import { currencyCodeEnum, paymentMethodTypeEnum } from "@/backend/db/schema/enums";
import { teachers } from "@/backend/db/schema/teachers/teachers";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import type { PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import type { PaymentMethodTransactionSnapshot } from "@/backend/types/billing/payment-method.types";

/**
 * Teacher Payments table.
 * Links each disbursement to the payment method snapshot used at payment time.
 */
export const teacherPayments = pgTable(
  "teacher_payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "restrict" }),
    userPaymentMethodId: uuid("user_payment_method_id").references(() => userPaymentMethods.id, {
      onDelete: "set null",
    }),
    paymentMethodType: paymentMethodTypeEnum("payment_method_type").notNull().$type<PaymentMethodType>(),
    paymentMethodSnapshot: jsonb("payment_method_snapshot").$type<PaymentMethodTransactionSnapshot>().notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    currency: currencyCodeEnum("currency").notNull().$type<CurrencyCode>(),
    paymentDate: timestamp("payment_date", { withTimezone: true, precision: 3 }).notNull(),
    isTestPayment: boolean("is_test_payment").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [
    index("teacher_payments_teacher_id_idx").on(table.teacherId),
    index("teacher_payments_user_payment_method_id_idx").on(table.userPaymentMethodId),
    index("teacher_payments_payment_date_idx").on(table.paymentDate),
    index("teacher_payments_payment_method_type_idx").on(table.paymentMethodType),
    index("teacher_payments_is_test_payment_idx").on(table.isTestPayment),
  ]
);
