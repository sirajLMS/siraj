import {
  createTable,
  index,
  jsonbColumn,
  timestampColumn,
  uniqueIndex,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { whatsappMessageDirectionEnum } from "@/backend/db/schema/enums";
import { whatsappAccounts } from "@/backend/db/schema/whatsapp/whatsapp-accounts";
import { whatsappGroups } from "@/backend/db/schema/whatsapp/whatsapp-groups";

/**
 * WhatsApp group messages (Meta WhatsApp Cloud API Groups).
 *
 * Idempotency contract: `wamid` is Meta's globally unique message id and is
 * stored with a unique constraint — group message syncs and inbound webhook
 * deliveries of the same message upsert on it instead of duplicating.
 *
 * `direction` reuses the shared `whatsapp_message_direction` pg enum from
 * `whatsapp_messages`. `fromWaId` carries the sender's WhatsApp ID for
 * inbound group messages. `pinnedAt`/`pinExpiresAt` track Meta-side pin
 * state for pinned group messages.
 */
export const whatsappGroupMessages = createTable(
  "whatsapp_group_messages",
  {
    id: uuidColumn("id"),
    groupId: uuidDefaultColumn("group_id")
      .notNull()
      .references(() => whatsappGroups.id, { onDelete: "cascade" }),
    accountId: uuidDefaultColumn("account_id")
      .notNull()
      .references(() => whatsappAccounts.id, { onDelete: "cascade" }),
    wamid: varcharColumn("wamid", { length: 128 }).notNull(),
    direction: whatsappMessageDirectionEnum("direction").notNull(),
    type: varcharColumn("type", { length: 32 }).notNull(),
    content: jsonbColumn("content").notNull(),
    status: varcharColumn("status", { length: 20 }),
    fromWaId: varcharColumn("from_wa_id", { length: 32 }),
    mediaId: varcharColumn("media_id", { length: 256 }),
    mediaMime: varcharColumn("media_mime", { length: 128 }),
    pinnedAt: timestampColumn("pinned_at"),
    pinExpiresAt: timestampColumn("pin_expires_at"),
    sentAt: timestampColumn("sent_at"),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
  },
  table => [
    uniqueIndex("whatsapp_group_messages_wamid_unique").on(table.wamid),
    index("whatsapp_group_messages_group_sent_at_idx").on(table.groupId, table.sentAt),
  ]
);
