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
    idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, precision: 3 }),
  },
  table => [
    uniqueIndex("quotas_idempotency_key_unique_idx").on(table.idempotencyKey),
    index("quotas_student_id_idx").on(table.studentId),
    index("quotas_student_status_remaining_idx")
      .on(table.studentId, table.status, table.remaining)
      .where(sql`deleted_at IS NULL AND status = 'ACTIVE' AND remaining > 0`),
    index("quotas_valid_until_idx").on(table.validUntil).where(sql`deleted_at IS NULL AND status = 'ACTIVE'`),
    check(
      "quotas_kind_period_consistency_chk",
      sql`
        (${table.kind} = 'PACKAGE' AND ${table.periodType} IS NULL AND ${table.periodDays} IS NULL AND ${table.periodAnchor} IS NULL) OR
        (${table.kind} = 'PERIODIC' AND ${table.periodType} IS NOT NULL AND ${table.periodDays} IS NOT NULL)
      `
    ),
    check("quotas_remaining_non_negative_chk", sql`${table.remaining} >= 0`),
    check(
      "quotas_reserved_plus_remaining_chk",
      sql`${table.reservedClasses} + ${table.remaining} <= ${table.totalClasses}`
    ),
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
