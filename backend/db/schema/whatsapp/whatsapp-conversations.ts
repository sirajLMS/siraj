import { sql } from "drizzle-orm";
import {
  createTable,
  index,
  timestampColumn,
  uniqueIndex,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { whatsappAccounts } from "@/backend/db/schema/whatsapp/whatsapp-accounts";

/**
 * WhatsApp conversations (inbox threads) for a sender account.
 *
 * A conversation is identified by a flexible peer triple — `waId` (phone-based
 * WhatsApp ID), `userId` (BSUID, delivered under the usernames rollout), and
 * `username` — because Meta currently transitions identity from phone numbers
 * to usernames. Exactly one of `waId`/`userId` is present on any given
 * webhook payload; both are kept nullable and guarded by partial unique
 * indexes so earlier phone-based rows can later match BSUID-keyed updates.
 *
 * `lastMessageAt`/`lastMessagePreview` are denormalized rollups maintained on every message upsert so the inbox list never joins messages.
 */
export const whatsappConversations = createTable(
  "whatsapp_conversations",
  {
    id: uuidColumn("id"),
    accountId: uuidDefaultColumn("account_id")
      .notNull()
      .references(() => whatsappAccounts.id, { onDelete: "cascade" }),
    waId: varcharColumn("wa_id", { length: 32 }),
    userId: varcharColumn("user_id", { length: 64 }),
    username: varcharColumn("username", { length: 128 }),
    displayName: varcharColumn("display_name", { length: 255 }),
    lastMessageAt: timestampColumn("last_message_at"),
    lastMessagePreview: varcharColumn("last_message_preview", { length: 140 }),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestampColumn("deleted_at"),
  },
  table => [
    uniqueIndex("whatsapp_conversations_account_wa_id_unique")
      .on(table.accountId, table.waId)
      .where(sql`${table.waId} IS NOT NULL`),
    uniqueIndex("whatsapp_conversations_account_user_id_unique")
      .on(table.accountId, table.userId)
      .where(sql`${table.userId} IS NOT NULL`),
    index("whatsapp_conversations_account_last_message_at_idx").on(table.accountId, table.lastMessageAt),
  ]
);
