import {
  createTable,
  index,
  timestampColumn,
  uniqueIndex,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { users } from "@/backend/db/schema/users/users";
import { whatsappAccounts } from "@/backend/db/schema/whatsapp/whatsapp-accounts";

/**
 * Per-account registry of recipient phone numbers allowed when the sending
 * number is a Meta test number (test numbers may only message pre-approved
 * recipients).
 *
 * `status` is a closed set (`PENDING` | `ALLOWED`) kept as varchar, matching
 * the tier/quality style of free-form short status columns on
 * `whatsapp_accounts`. `lastErrorCode` stores Meta's numeric error code
 * (e.g. "131030") for operator diagnostics.
 *
 * One row per (account, phoneNumber); rows cascade-delete with the account.
 */
export const whatsappTestRecipients = createTable(
  "whatsapp_test_recipients",
  {
    id: uuidColumn("id"),
    accountId: uuidDefaultColumn("account_id")
      .notNull()
      .references(() => whatsappAccounts.id, { onDelete: "cascade" }),
    phoneNumber: varcharColumn("phone_number", { length: 32 }).notNull(),
    status: varcharColumn("status", { length: 16 }).notNull().default("PENDING"),
    lastCheckedAt: timestampColumn("last_checked_at"),
    lastErrorCode: varcharColumn("last_error_code", { length: 24 }),
    note: varcharColumn("note", { length: 200 }),
    createdByUserId: uuidDefaultColumn("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  table => [
    uniqueIndex("whatsapp_test_recipients_account_phone_unique").on(table.accountId, table.phoneNumber),
    index("whatsapp_test_recipients_account_id_idx").on(table.accountId),
  ]
);
