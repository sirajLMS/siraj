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
import { quotas } from "@/backend/db/schema/billing/quotas";
import { classInstances, recurringSchedules } from "@/backend/db/schema/classes/scheduling";
import { quotaLedgerReasonEnum } from "@/backend/db/schema/enums";
import { students } from "@/backend/db/schema/students/students";
import { users } from "@/backend/db/schema/users/users";

export const quotaLedger = createTable(
  "quota_ledger",
  {
    id: uuidColumn("id"),
    quotaId: uuidDefaultColumn("quota_id")
      .notNull()
      .references(() => quotas.id, { onDelete: "restrict" }),
    studentId: uuidDefaultColumn("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),
    recurringScheduleId: uuidDefaultColumn("recurring_schedule_id").references(() => recurringSchedules.id, {
      onDelete: "set null",
    }),
    classInstanceId: uuidDefaultColumn("class_instance_id").references(() => classInstances.id, {
      onDelete: "set null",
    }),
    delta: integerColumn("delta").notNull(),
    reason: quotaLedgerReasonEnum("reason").notNull(),
    reasonNote: textColumn("reason_note"),
    /**
     * Deterministic SHA-256 idempotency key.
     *
     * Pattern: `sha256(quotaId|reason|classInstanceId|recurringScheduleId)` → hex digest.
     * The pipe-delimited segments are concatenated (null segments rendered as empty
     * strings) and hashed with SHA-256 to produce a 64-character hex string. This
     * guarantees that every ledger entry for the same quota + reason + context is
     * deduplicated via the unique index below.
     */
    idempotencyKey: varcharColumn("idempotency_key", { length: 255 }).notNull(),
    actorUserId: uuidDefaultColumn("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
  },
  table => [
    uniqueIndex("quota_ledger_idempotency_key_unique_idx").on(table.idempotencyKey),
    index("quota_ledger_quota_id_created_at_idx").on(table.quotaId, table.createdAt),
    index("quota_ledger_student_id_idx").on(table.studentId),
    index("quota_ledger_class_instance_id_idx").on(table.classInstanceId),
    index("quota_ledger_recurring_schedule_id_idx").on(table.recurringScheduleId),
  ]
);
