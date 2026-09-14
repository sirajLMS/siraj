import {
  createTable,
  index,
  textColumn,
  timestampColumn,
  uuidColumn,
  uuidDefaultColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { invoices } from "@/backend/db/schema/billing/billing";
import { invoicePaymentSubmissionStatusEnum } from "@/backend/db/schema/enums";
import { storageFiles } from "@/backend/db/schema/storage/storage";
import { users } from "@/backend/db/schema/users/users";

export const invoicePaymentSubmissions = createTable(
  "invoice_payment_submissions",
  {
    id: uuidColumn("id"),
    invoiceId: uuidDefaultColumn("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "restrict" }),
    fileId: uuidDefaultColumn("file_id")
      .notNull()
      .references(() => storageFiles.id, { onDelete: "restrict" }),
    submittedByUserId: uuidDefaultColumn("submitted_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    submittedAt: timestampColumn("submitted_at").notNull(),
    reviewedByUserId: uuidDefaultColumn("reviewed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestampColumn("reviewed_at"),
    status: invoicePaymentSubmissionStatusEnum("status").notNull(),
    rejectionReason: textColumn("rejection_reason"),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
  },
  table => [
    index("invoice_payment_submissions_invoice_id_idx").on(table.invoiceId),
    index("invoice_payment_submissions_status_idx").on(table.status),
    index("invoice_payment_submissions_file_id_idx").on(table.fileId),
    index("invoice_payment_submissions_submitted_by_user_id_idx").on(table.submittedByUserId),
    index("invoice_payment_submissions_reviewed_by_user_id_idx").on(table.reviewedByUserId),
    index("invoice_payment_submissions_submitted_at_idx").on(table.submittedAt),
    index("invoice_payment_submissions_reviewed_at_idx").on(table.reviewedAt),
  ]
);
