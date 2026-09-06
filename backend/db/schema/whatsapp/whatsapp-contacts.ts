import { sql } from "drizzle-orm";
import {
  createTable,
  timestampColumn,
  uniqueIndex,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { whatsappAccounts } from "@/backend/db/schema/whatsapp/whatsapp-accounts";

/**
 * WhatsApp contacts synced from the Business app via the one-shot
 * `smb_app_state_sync` stream (add/remove actions).
 *
 * A contact row keeps the identity triple (`phoneNumber` / `userId` BSUID /
 * `username`) because Meta mid-rollout of usernames may omit phone numbers.
 * Partial unique indexes enforce one row per (account, phone) and
 * (account, user) while allowing any single identity to be absent.
 *
 * Remove actions keep the row with `removedAt` set (soft state) and
 * `lastActionAt` (from `metadata.timestamp`) guards last-writer-wins ordering
 * for out-of-order `add`/`remove` deliveries.
 */
export const whatsappContacts = createTable(
  "whatsapp_contacts",
  {
    id: uuidColumn("id"),
    accountId: uuidDefaultColumn("account_id")
      .notNull()
      .references(() => whatsappAccounts.id, { onDelete: "cascade" }),
    phoneNumber: varcharColumn("phone_number", { length: 32 }),
    userId: varcharColumn("user_id", { length: 64 }),
    username: varcharColumn("username", { length: 128 }),
    fullName: varcharColumn("full_name", { length: 255 }),
    firstName: varcharColumn("first_name", { length: 128 }),
    removedAt: timestampColumn("removed_at"),
    lastActionAt: timestampColumn("last_action_at").notNull(),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  table => [
    uniqueIndex("whatsapp_contacts_account_phone_unique")
      .on(table.accountId, table.phoneNumber)
      .where(sql`${table.phoneNumber} IS NOT NULL`),
    uniqueIndex("whatsapp_contacts_account_user_id_unique")
      .on(table.accountId, table.userId)
      .where(sql`${table.userId} IS NOT NULL`),
  ]
);
