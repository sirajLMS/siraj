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
 * Input for the conversations add-recipient service/mutation. `accountId`
 * scopes the recipient to its account; test numbers are capped at Meta's
 * 5-recipient allow-list limit.
 */
export interface AddWhatsappRecipientInput {
  /** Caller performing the mutation (resolved from GraphQL ctx by the service layer). */
  readonly actorUserId: string;
  readonly accountId: string;
  readonly phoneNumber: string;
  readonly note?: string | null;
}

/**
 * Input for the conversations remove-recipient service/mutation. Rows are
 * hard-deleted from the registry.
 */
export interface RemoveWhatsappRecipientInput {
  /** Caller performing the mutation (resolved from GraphQL ctx by the service layer). */
  readonly actorUserId: string;
  readonly recipientId: string;
}

/**
 * Input for the conversations verify-recipient service/mutation. Dispatches
 * the approved test template to prove Meta will accept sends to the
 * recipient, and records the verdict on the row.
 */
export interface VerifyWhatsappRecipientInput {
  /** Caller performing the mutation (resolved from GraphQL ctx by the service layer). */
  readonly actorUserId: string;
  readonly recipientId: string;
}

/**
 * Service input for the conversations `sendMessage` mutation: the canonical
 * send input plus the caller performing the mutation (resolved from GraphQL
 * ctx by the service layer).
 */
export interface SendWhatsappConversationMessageInput extends WhatsappConversationSendInput {
  /** Caller performing the mutation (resolved from GraphQL ctx by the service layer). */
  readonly actorUserId: string;
}

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
