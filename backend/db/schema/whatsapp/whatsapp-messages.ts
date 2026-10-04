import {
  booleanColumn,
  createTable,
  index,
  integerColumn,
  timestampColumn,
  uniqueIndex,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { whatsappMessageColumns } from "@/backend/db/schema/whatsapp/__shared__";
import { whatsappConversations } from "@/backend/db/schema/whatsapp/whatsapp-conversations";

/**
 * WhatsApp messages (inbox contents) for coexistence + multi-number accounts.
 *
 * Idempotency contract: `wamid` is Meta's globally unique message id and is
 * stored with a unique constraint — history sync, live echo, and inbound
 * deliveries of the same message upsert on it instead of duplicating.
 *
 * Media: history sync delivers `media_placeholder` rows; a follow-up media
 * webhook only arrives for media ≤14 days old at onboarding and the delivered
 * asset id expires 7 days after webhook receipt — `mediaPlaceholder` stays
 * true when the asset was never fetchable and the UI renders a placeholder.
 *
 * `phase`/`chunkOrder` record history-sync provenance for chunk-level dedupe
 * and replay diagnosis (phases 0/1/2 = day 0–1 / 1–90 / 90–180 chunks).
 */
export const whatsappMessages = createTable(
  "whatsapp_messages",
  {
    id: uuidColumn("id"),
    conversationId: uuidDefaultColumn("conversation_id")
      .notNull()
      .references(() => whatsappConversations.id, { onDelete: "cascade" }),
    ...whatsappMessageColumns(),
    mediaPlaceholder: booleanColumn("media_placeholder").notNull().default(false),
    mediaId: varcharColumn("media_id", { length: 128 }),
    mediaMime: varcharColumn("media_mime", { length: 64 }),
    mediaSha256: varcharColumn("media_sha256", { length: 64 }),
    phase: integerColumn("phase"),
    chunkOrder: integerColumn("chunk_order"),
    sentAt: timestampColumn("sent_at"),
    editedAt: timestampColumn("edited_at"),
    revokedAt: timestampColumn("revoked_at"),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
  },
  table => [
    uniqueIndex("whatsapp_messages_wamid_unique").on(table.wamid),
    index("whatsapp_messages_conversation_sent_at_idx").on(table.conversationId, table.sentAt),
    index("whatsapp_messages_account_sent_at_idx").on(table.accountId, table.sentAt),
    index("whatsapp_messages_account_phase_chunk_idx").on(table.accountId, table.phase, table.chunkOrder),
  ]
);
