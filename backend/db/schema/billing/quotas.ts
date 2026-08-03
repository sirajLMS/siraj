import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { quotaKindEnum, quotaPeriodTypeEnum, quotaStatusEnum } from "@/backend/db/schema/enums";
import { students } from "@/backend/db/schema/students/students";

export const quotas = pgTable(
  "quotas",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    kind: quotaKindEnum("kind").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    totalClasses: integer("total_classes").notNull(),
    remaining: integer("remaining").notNull().default(0),
    reservedClasses: integer("reserved_classes").notNull().default(0),
    usedThisPeriod: integer("used_this_period").notNull().default(0),
    periodType: quotaPeriodTypeEnum("period_type"),
    periodDays: integer("period_days"),
    periodAnchor: timestamp("period_anchor", { withTimezone: true, precision: 3 }),
    validFrom: date("valid_from"),
    validUntil: date("valid_until"),
    status: quotaStatusEnum("status").notNull().default("ACTIVE"),
    priority: integer("priority").notNull().default(0),
    rolloverPolicy: jsonb("rollover_policy"),
    version: integer("version").notNull().default(1),
    /**
     * Deterministic SHA-256 idempotency key.
     *
     * Pattern: `sha256(studentId|kind|name|validFrom|validUntil)` → hex digest.
     * The pipe-delimited segments are concatenated and hashed with SHA-256 to
     * produce a 64-character hex string. This guarantees that duplicate quota
     * creation attempts for the same student + kind + name + validity window are
     * deduplicated via the unique index below.
     */
    idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, precision: 3 }),
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
    check(
      "quotas_kind_period_consistency_chk",
      sql`
        (${table.kind} = 'PACKAGE' AND ${table.periodType} IS NULL AND ${table.periodDays} IS NULL AND ${table.periodAnchor} IS NULL) OR
        (${table.kind} = 'PERIODIC' AND ${table.periodType} IS NOT NULL AND ${table.periodDays} IS NOT NULL)
      `
    ),
    check("quotas_total_classes_positive_chk", sql`${table.totalClasses} > 0`),
    check("quotas_priority_non_negative_chk", sql`${table.priority} >= 0`),
    check("quotas_remaining_non_negative_chk", sql`${table.remaining} >= 0`),
    check("quotas_reserved_classes_non_negative_chk", sql`${table.reservedClasses} >= 0`),
    check("quotas_reserved_not_exceed_remaining_chk", sql`${table.reservedClasses} <= ${table.remaining}`),
    check("quotas_used_this_period_non_negative_chk", sql`${table.usedThisPeriod} >= 0`),
    check(
      "quotas_rollover_policy_valid_chk",
      sql`
        ${table.rolloverPolicy} IS NULL OR (
          jsonb_typeof(${table.rolloverPolicy}) = 'object' AND
          ${table.rolloverPolicy} ? 'maxRolloverPercent' AND
          ${table.rolloverPolicy} ? 'accumulationCap'
        )
      `
    ),
  ]
);
