import {
  createTable,
  index,
  integerColumn,
  jsonbColumn,
  timestampColumn,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { whatsappWebhookEventStatusEnum } from "@/backend/db/schema/enums";
import { whatsappAccounts } from "@/backend/db/schema/whatsapp/whatsapp-accounts";
import { WhatsappWebhookEventStatus } from "@/backend/enum/whatsapp";

/**
 * Durable WhatsApp webhook event queue.
 *
 * The webhook route inserts one row per payload `change` BEFORE acking 200
 * (persist-first, process-async), because asynchronous `after()` processing
 * is not guaranteed on serverless — a sweeper cron reclaims stale PENDING
 * rows. Meta retries deliveries for up to 7 days with duplicate bodies, so
 * processing is idempotent at the entity level (`wamid` upserts, contact LWW)
 * rather than rejecting redeliveries.
 *
 * `payloadHash` (sha256 of the canonical change body) backs the short-window
 * exact-replay dedupe; `accountId` is resolved post-insert (nullable for
 * payloads that cannot be matched to an account).
 */
export const whatsappWebhookEvents = createTable(
  "whatsapp_webhook_events",
  {
    id: uuidColumn("id"),
    accountId: uuidDefaultColumn("account_id").references(() => whatsappAccounts.id, { onDelete: "cascade" }),
    field: varcharColumn("field", { length: 64 }).notNull(),
    payload: jsonbColumn("payload").notNull(),
    payloadHash: varcharColumn("payload_hash", { length: 64 }).notNull(),
    status: whatsappWebhookEventStatusEnum("status").notNull().default(WhatsappWebhookEventStatus.PENDING),
    attempts: integerColumn("attempts").notNull().default(0),
    receivedAt: timestampColumn("received_at").notNull().defaultNow(),
    processedAt: timestampColumn("processed_at"),
  },
  table => [index("whatsapp_webhook_events_status_received_at_idx").on(table.status, table.receivedAt)]
);
