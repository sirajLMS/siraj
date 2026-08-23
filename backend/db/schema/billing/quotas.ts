import { sql } from "drizzle-orm";
import {
  checkConstraint,
  createTable,
  index,
  integerColumn,
  jsonbColumn,
  textColumn,
  timestampColumn,
  uniqueIndex,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { quotaKindEnum, quotaPeriodTypeEnum, quotaStatusEnum } from "@/backend/db/schema/enums";
import { students } from "@/backend/db/schema/students/students";

export const quotas = createTable(
  "quotas",
  {
    id: uuidColumn("id"),
    studentId: uuidDefaultColumn("student_id")
      .notNull()
      .references(() => students.id as never, { onDelete: "cascade" }),
    kind: quotaKindEnum("kind").notNull(),
    name: varcharColumn("name", { length: 255 }).notNull(),
    totalClasses: integerColumn("total_classes").notNull(),
    remaining: integerColumn("remaining").notNull().default(0),
    reservedClasses: integerColumn("reserved_classes").notNull().default(0),
    usedThisPeriod: integerColumn("used_this_period").notNull().default(0),
    periodType: quotaPeriodTypeEnum("period_type"),
    periodDays: integerColumn("period_days"),
    periodAnchor: timestampColumn("period_anchor"),
    // date -> text for SQLite (ISO-8601 string preserves ordering & semantics); PG keeps date.
    validFrom: textColumn("valid_from"),
    validUntil: textColumn("valid_until"),
    status: quotaStatusEnum("status").notNull().default("ACTIVE"),
    priority: integerColumn("priority").notNull().default(0),
    rolloverPolicy: jsonbColumn("rollover_policy"),
    version: integerColumn("version").notNull().default(1),
    /**
     * Deterministic SHA-256 idempotency key.
     *
     * Pattern: `sha256(studentId|kind|name|validFrom|validUntil)` → hex digest.
     * The pipe-delimited segments are concatenated and hashed with SHA-256 to
     * produce a 64-character hex string. This guarantees that duplicate quota
     * creation attempts for the same student + kind + name + validity window are
     * deduplicated via the unique index below.
     */
    idempotencyKey: varcharColumn("idempotency_key", { length: 255 }).notNull(),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
    deletedAt: timestampColumn("deleted_at"),
  },
  table => [
    // NOTE: Unique index on idempotency_key requires all inserts to supply a globally unique value — NOT NULL with no default.
    uniqueIndex("quotas_idempotency_key_unique_idx").on(table.idempotencyKey),
    index("quotas_student_id_idx").on(table.studentId),
    index("quotas_student_status_remaining_idx")
      .on(table.studentId, table.status, table.remaining)
      .where(sql`deleted_at IS NULL AND status = 'ACTIVE' AND remaining > 0`),
    index("quotas_valid_until_idx").on(table.validUntil).where(sql`deleted_at IS NULL AND status = 'ACTIVE'`),
    index("quotas_admin_list_idx").on(table.studentId, table.status, table.deletedAt),
    // Portable CHECK: uses only standard SQL (=, IS NULL, IS NOT NULL, AND, OR).
    checkConstraint(
      "quotas_kind_period_consistency_chk",
      sql`
        (${table.kind} = 'PACKAGE' AND ${table.periodType} IS NULL AND ${table.periodDays} IS NULL AND ${table.periodAnchor} IS NULL) OR
        (${table.kind} = 'PERIODIC' AND ${table.periodType} IS NOT NULL AND ${table.periodDays} IS NOT NULL)
      `,
      sql`
        (${table.kind} = 'PACKAGE' AND ${table.periodType} IS NULL AND ${table.periodDays} IS NULL AND ${table.periodAnchor} IS NULL) OR
        (${table.kind} = 'PERIODIC' AND ${table.periodType} IS NOT NULL AND ${table.periodDays} IS NOT NULL)
      `
    ),
    checkConstraint("quotas_total_classes_positive_chk", sql`${table.totalClasses} > 0`, sql`${table.totalClasses} > 0`),
    checkConstraint("quotas_priority_non_negative_chk", sql`${table.priority} >= 0`, sql`${table.priority} >= 0`),
    checkConstraint("quotas_remaining_non_negative_chk", sql`${table.remaining} >= 0`, sql`${table.remaining} >= 0`),
    checkConstraint("quotas_reserved_classes_non_negative_chk", sql`${table.reservedClasses} >= 0`, sql`${table.reservedClasses} >= 0`),
    checkConstraint(
      "quotas_reserved_not_exceed_remaining_chk",
      sql`${table.reservedClasses} <= ${table.remaining}`,
      sql`${table.reservedClasses} <= ${table.remaining}`
    ),
    checkConstraint("quotas_used_this_period_non_negative_chk", sql`${table.usedThisPeriod} >= 0`, sql`${table.usedThisPeriod} >= 0`),
    // PG-only CHECK: relies on `jsonb_typeof()` and the `?` JSON key-existence
    // operator — both PostgreSQL-specific. SQLite has no equivalents (its jsonb
    // column stores text). Rollover policy shape validation is enforced at the
    // app layer on SQLite.
    checkConstraint(
      "quotas_rollover_policy_valid_chk",
      sql`
        ${table.rolloverPolicy} IS NULL OR (
          jsonb_typeof(${table.rolloverPolicy}) = 'object' AND
          ${table.rolloverPolicy} ? 'maxRolloverPercent' AND
          ${table.rolloverPolicy} ? 'accumulationCap'
        )
      `,
      null
    ),
  ]
);
