import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { quotas } from "@/backend/db/schema/billing/quotas";
import { classInstances, recurringSchedules } from "@/backend/db/schema/classes/scheduling";
import { quotaLedgerReasonEnum } from "@/backend/db/schema/enums";
import { students } from "@/backend/db/schema/students/students";
import { users } from "@/backend/db/schema/users/users";

export const quotaLedger = pgTable(
  "quota_ledger",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    quotaId: uuid("quota_id")
      .notNull()
      .references(() => quotas.id, { onDelete: "restrict" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),
    recurringScheduleId: uuid("recurring_schedule_id").references(() => recurringSchedules.id, {
      onDelete: "set null",
    }),
    classInstanceId: uuid("class_instance_id").references(() => classInstances.id, {
      onDelete: "set null",
    }),
    delta: integer("delta").notNull(),
    reason: quotaLedgerReasonEnum("reason").notNull(),
    reasonNote: text("reason_note"),
    idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull(),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  table => [
    uniqueIndex("quota_ledger_idempotency_key_unique_idx").on(table.idempotencyKey),
    index("quota_ledger_quota_id_created_at_idx").on(table.quotaId, table.createdAt),
    index("quota_ledger_student_id_idx").on(table.studentId),
    index("quota_ledger_class_instance_id_idx").on(table.classInstanceId),
    index("quota_ledger_recurring_schedule_id_idx").on(table.recurringScheduleId),
  ]
);
