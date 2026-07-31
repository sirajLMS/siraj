import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { payments } from "@/backend/db/schema/billing/billing";
import { classInstances } from "@/backend/db/schema/classes/scheduling";
import { creditReasonEnum } from "@/backend/db/schema/enums";
import { students } from "@/backend/db/schema/students/students";
import { users } from "@/backend/db/schema/users/users";

export const creditTransactions = pgTable(
  "credit_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    changeAmount: integer("change_amount").notNull(),
    reason: creditReasonEnum("reason").notNull(),
    sourcePaymentId: uuid("source_payment_id").references(() => payments.id, { onDelete: "set null" }),
    classInstanceId: uuid("class_instance_id").references(() => classInstances.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    creditedByUserId: uuid("credited_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "set null" }),
    idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
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
