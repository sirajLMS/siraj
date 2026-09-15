import type { whatsappTestRecipients } from "@/backend/db/schema";
import type {
  WhatsappConversationSendMode,
  WhatsappTestRecipientStatus,
} from "@/backend/enum/whatsapp/whatsapp-conversations.enum";
import type {
  WhatsappConversationMessagesPaginatedResult,
  WhatsappConversationReturnType,
  WhatsappMessageReturnType,
} from "@/backend/types/whatsapp/whatsapp-inbox.types";

/**
 * Canonical type definitions for the `whatsapp_test_recipients` registry and
 * the `/whatsapp` conversations workspace send contract.
 *
 * The registry rows live behind `WhatsappAccountReturnType.isTestNumber`:
 * Meta test sender numbers may only message pre-approved recipients, so the
 * service hard-blocks sends to numbers not in ALLOWED status for test numbers.
 */

export type WhatsappTestRecipientSelectType = typeof whatsappTestRecipients.$inferSelect;
export type WhatsappTestRecipientInsertType = typeof whatsappTestRecipients.$inferInsert;

export type WhatsappTestRecipientReturnType = Omit<WhatsappTestRecipientSelectType, "status"> & {
  status: WhatsappTestRecipientStatus; // Re-apply enum (stored as varchar in DB)
};

/**
 * Input for the conversations `sendMessage` service/mutation.
 *
 * `conversationId` resolves the thread for history/touch bookkeeping;
 * absent/null means a brand-new conversation target (`to` is the digits-only
 * recipient). `mode` gates the required payload: TEXT requires `body`
 * (only legal inside the 24h service window), TEMPLATE requires
 * `templateName` (+ optional `templateLanguage`).
 */
export interface WhatsappConversationSendInput {
  readonly accountId: string;
  readonly conversationId?: string | null;
  readonly to: string;
  readonly mode: WhatsappConversationSendMode;
  readonly templateName?: string;
  readonly templateLanguage?: string;
  readonly body?: string;
}

/**
 * Result envelope of a successful send: the persisted outbound message row
 * (`direction: API_OUTBOUND`) with content jsonb, per
 * `WhatsappMessageReturnType` in `whatsapp-inbox.types.ts`.
 */
export interface WhatsappConversationSendResult {
  readonly message: WhatsappMessageReturnType;
}

/**
 * Thread-detail envelope for the conversations workspace thread query: the
 * conversation row plus its paginated messages envelope.
 */
export interface WhatsappConversationThreadResult {
  readonly conversation: WhatsappConversationReturnType;
  readonly messages: WhatsappConversationMessagesPaginatedResult;
}
