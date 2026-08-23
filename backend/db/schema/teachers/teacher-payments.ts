import {
  booleanColumn,
  createTable,
  index,
  jsonbColumn,
  textColumn,
  timestampColumn,
  uuidColumn,
  uuidDefaultColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { userPaymentMethods } from "@/backend/db/schema/billing/user-payment-methods";
import { currencyCodeEnum, paymentMethodTypeEnum } from "@/backend/db/schema/enums";
import { teachers } from "@/backend/db/schema/teachers/teachers";
import type { PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import type { PaymentMethodTransactionSnapshot } from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

/**
 * Teacher Payments table.
 * Links each disbursement to the payment method snapshot used at payment time.
 */
export const teacherPayments = createTable(
  "teacher_payments",
  {
    id: uuidColumn("id"),
    teacherId: uuidDefaultColumn("teacher_id")
      .notNull()
      .references(() => teachers.id as never, { onDelete: "restrict" }),
    userPaymentMethodId: uuidDefaultColumn("user_payment_method_id").references(() => userPaymentMethods.id as never, {
      onDelete: "set null",
    }),
    paymentMethodType: paymentMethodTypeEnum("payment_method_type").notNull().$type<PaymentMethodType>(),
    paymentMethodSnapshot: jsonbColumn<PaymentMethodTransactionSnapshot>("payment_method_snapshot").notNull(),
    // PG-only: `numeric` column has no dialect-aware helper — degraded to TEXT.
    // SQLite uses NUMERIC column affinity; precision/scale enforced at app layer.
    amount: textColumn("amount").notNull(),
    currency: currencyCodeEnum("currency").notNull().$type<CurrencyCode>(),
    paymentDate: timestampColumn("payment_date").notNull(),
    isTestPayment: booleanColumn("is_test_payment").notNull().default(false),
    createdAt: timestampColumn("created_at").notNull(),
    updatedAt: timestampColumn("updated_at").notNull(),
  },
  table => [
    index("teacher_payments_teacher_id_idx").on(table.teacherId),
    index("teacher_payments_user_payment_method_id_idx").on(table.userPaymentMethodId),
    index("teacher_payments_payment_date_idx").on(table.paymentDate),
    index("teacher_payments_payment_method_type_idx").on(table.paymentMethodType),
    index("teacher_payments_is_test_payment_idx").on(table.isTestPayment),
  ]
);
