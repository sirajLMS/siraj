import { index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { invoices } from "@/backend/db/schema/billing/billing";
import { storageFiles } from "@/backend/db/schema/storage/storage";
import { users } from "@/backend/db/schema/users/users";

export const invoicePaymentSubmissionStatusEnum = pgEnum("invoice_payment_submission_status", [
  "pending",
  "approved",
  "rejected",
]);

export const invoicePaymentSubmissions = pgTable(
  "invoice_payment_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "restrict" }),
    fileId: uuid("file_id")
      .notNull()
      .references(() => storageFiles.id, { onDelete: "restrict" }),
    submittedByUserId: uuid("submitted_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    submittedAt: timestamp("submitted_at", { withTimezone: true, precision: 3 }).notNull(),
    reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true, precision: 3 }),
    status: invoicePaymentSubmissionStatusEnum("status").notNull(),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  table => [
    index("invoice_payment_submissions_invoice_id_idx").on(table.invoiceId),
    index("invoice_payment_submissions_status_idx").on(table.status),
    index("invoice_payment_submissions_file_id_idx").on(table.fileId),
  ]
);
