import {
  createTable,
  index,
  integerColumn,
  textColumn,
  timestampColumn,
  uniqueIndex,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { payments } from "@/backend/db/schema/billing/billing";
import { classInstances } from "@/backend/db/schema/classes/scheduling";
import { creditReasonEnum } from "@/backend/db/schema/enums";
import { students } from "@/backend/db/schema/students/students";
import { users } from "@/backend/db/schema/users/users";

export const creditTransactions = createTable(
  "credit_transactions",
  {
    id: uuidColumn("id"),
    studentId: uuidDefaultColumn("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    changeAmount: integerColumn("change_amount").notNull(),
    reason: creditReasonEnum("reason").notNull(),
    sourcePaymentId: uuidDefaultColumn("source_payment_id").references(() => payments.id, {
      onDelete: "set null",
    }),
    classInstanceId: uuidDefaultColumn("class_instance_id").references(() => classInstances.id, {
      onDelete: "set null",
    }),
    notes: textColumn("notes"),
    creditedByUserId: uuidDefaultColumn("credited_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "set null" }),
    idempotencyKey: varcharColumn("idempotency_key", { length: 255 }).notNull(),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
  },
  table => [
    uniqueIndex("credit_transactions_idempotency_key_unique_idx").on(table.idempotencyKey),
    index("credit_transactions_student_id_idx").on(table.studentId),
    index("credit_transactions_reason_idx").on(table.reason),
    index("credit_transactions_class_instance_id_idx").on(table.classInstanceId),
    index("credit_transactions_created_at_idx").on(table.createdAt),
    index("credit_transactions_source_payment_id_idx").on(table.sourcePaymentId),
    index("credit_transactions_credited_by_user_id_idx").on(table.creditedByUserId),
  ]
);
