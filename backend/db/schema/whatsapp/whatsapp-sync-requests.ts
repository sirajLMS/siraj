import {
  createTable,
  timestampColumn,
  uniqueIndex,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { whatsappSyncRequestStatusEnum, whatsappSyncTypeEnum } from "@/backend/db/schema/enums";
import { whatsappAccounts } from "@/backend/db/schema/whatsapp/whatsapp-accounts";
import { WhatsappSyncRequestStatus } from "@/backend/enum/whatsapp";

/**
 * One-shot coexistence sync requests (`POST smb_app_data`).
 *
 * Meta accepts each sync type (contacts state sync, message history) exactly
 * once per account within 24 hours of coexistence onboarding — the unique
 * (accountId, syncType) index is the hard guarantee that a retry-safe enqueue
 * never asks Meta twice. A recorded `requestId` additionally guards against
 * re-POSTing after a transient client failure (the Meta accept response is
 * the point of no return).
 *
 * `request_id` is a support/diagnostic handle only: it is never echoed back
 * on follow-up webhooks, so nothing correlates webhooks through it.
 */
export const whatsappSyncRequests = createTable(
  "whatsapp_sync_requests",
  {
    id: uuidColumn("id"),
    accountId: uuidDefaultColumn("account_id")
      .notNull()
      .references(() => whatsappAccounts.id, { onDelete: "cascade" }),
    syncType: whatsappSyncTypeEnum("sync_type").notNull(),
    requestId: varcharColumn("request_id", { length: 128 }),
    status: whatsappSyncRequestStatusEnum("status").notNull().default(WhatsappSyncRequestStatus.PENDING),
    requestedAt: timestampColumn("requested_at"),
    completedAt: timestampColumn("completed_at"),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  table => [uniqueIndex("whatsapp_sync_requests_account_type_unique").on(table.accountId, table.syncType)]
);
