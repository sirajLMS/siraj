import { date, index, numeric, pgTable, primaryKey, smallint, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { invoiceStatusEnum, invoiceTypeEnum } from "./enums";
import { parents } from "./parents";
import { students } from "./students";
import { users } from "./users";

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    parentId: uuid("parent_id")
      .notNull()
      .references(() => parents.id, { onDelete: "restrict" }),
    studentId: uuid("student_id").references(() => students.id, { onDelete: "set null" }),
    issueDate: date("issue_date").notNull(),
    dueDate: date("due_date").notNull(),
    paidDate: date("paid_date"),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull(),
    status: invoiceStatusEnum("status").notNull(),
    invoiceType: invoiceTypeEnum("invoice_type").notNull(),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
    emailSentAt: timestamp("email_sent_at", { withTimezone: true, precision: 3 }),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, precision: 3 }),
  },
  table => [
    index("invoices_parent_id_idx").on(table.parentId),
    index("invoices_student_id_idx").on(table.studentId),
    index("invoices_status_due_date_idx").on(table.status, table.dueDate),
  ]
);

export const invoiceCoverageMonths = pgTable(
  "invoice_coverage_months",
  {
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "restrict" }),
    year: smallint("year").notNull(),
    month: smallint("month").notNull(),
  },
  table => [primaryKey({ columns: [table.invoiceId, table.year, table.month] })]
);
