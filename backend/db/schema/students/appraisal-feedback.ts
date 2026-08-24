import {
  createTable,
  index,
  textColumn,
  timestampColumn,
  uuidColumn,
  uuidDefaultColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { monthlyAppraisals } from "@/backend/db/schema/students/monthly-appraisals";
import { users } from "@/backend/db/schema/users/users";

/**
 * Appraisal Feedback table.
 *
 * Append-only child table enabling the parent/student ↔ teacher feedback loop
 * on a published monthly appraisal (R1.4). Each row is a single reply authored
 * by a user (student/parent or teacher); the chronological list is rendered to
 * both audiences.
 *
 * Design (F1 — chosen over a single `parentFeedback` text overwrite):
 * - Mirrors the `complaint_responses` pattern (FK cascade from parent table).
 * - `appraisalId` cascades on parent delete so feedback is removed with its
 *   appraisal; `authorUserId` cascades on user delete (matches complaint pattern
 *   for soft user-removal via `users.deletedAt` — but a hard user delete removes
 *   their authored feedback rows).
 * - Tenancy / authorship verification is enforced at the service layer (2.2):
 *   students/parents may only author feedback on appraisals they are tenancy-
 *   scoped to (own student/child); teachers may not author feedback (they author
 *   the appraisal itself).
 */
export const appraisalFeedback = createTable(
  "appraisal_feedback",
  {
    id: uuidColumn("id"),
    appraisalId: uuidDefaultColumn("appraisal_id")
      .notNull()
      .references(() => monthlyAppraisals.id, { onDelete: "cascade" }),
    authorUserId: uuidDefaultColumn("author_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: textColumn("body").notNull(),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
  },
  table => [
    index("appraisal_feedback_appraisal_id_idx").on(table.appraisalId),
    index("appraisal_feedback_author_user_id_idx").on(table.authorUserId),
    index("appraisal_feedback_created_at_idx").on(table.createdAt),
  ]
);
