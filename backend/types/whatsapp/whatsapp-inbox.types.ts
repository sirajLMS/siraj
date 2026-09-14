import type { whatsappContacts, whatsappConversations, whatsappMessages } from "@/backend/db/schema";
import type { WhatsappAccountPurpose } from "@/backend/enum/whatsapp/whatsapp-account.enum";
import type { WhatsappMessageDirection } from "@/backend/enum/whatsapp/whatsapp-inbox.enum";
import type { PageInfo, PaginationInput } from "@/backend/types/shared/pagination.types";

/**
 * Canonical type definitions for the WhatsApp inbox entities
 * (`whatsapp_conversations`, `whatsapp_messages`, `whatsapp_contacts`).
 *
 * Conversation and contact identity is intentionally flexible: Meta is
 * mid-migration from phone-based `wa_id` to business-scoped user ids
 * (`user_id` BSUID, optional `username`), so the identity triple stays
 * nullable on every entity and consumers must fall back across fields.
 */

export type WhatsappConversationSelectType = typeof whatsappConversations.$inferSelect;
export type WhatsappConversationInsertType = typeof whatsappConversations.$inferInsert;

export type WhatsappConversationReturnType = Omit<WhatsappConversationSelectType, "deletedAt"> & {
  /** Resolved from the owning account row when the read joins accounts (inbox list). */
  accountPurpose?: WhatsappAccountPurpose | null;
};

export type WhatsappMessageSelectType = typeof whatsappMessages.$inferSelect;
export type WhatsappMessageInsertType = typeof whatsappMessages.$inferInsert;

export type WhatsappMessageReturnType = Omit<WhatsappMessageSelectType, "direction" | "content"> & {
  direction: WhatsappMessageDirection; // Re-apply enum
  /** Per-message-type payload (`text`, `image`, `media_placeholder`, …). Always a JSON object. */
  content: Record<string, unknown>;
};

export type WhatsappContactSelectType = typeof whatsappContacts.$inferSelect;
/**
 * `removedAt` and `lastActionAt` are internal sync bookkeeping (soft-remove +
 * last-writer-wins guard) — they stay on `SelectType` for the contact repo,
 * but are not part of any consumer-facing contact shape.
 */
export type WhatsappContactReturnType = Omit<WhatsappContactSelectType, "removedAt" | "lastActionAt">;

/**
 * Input for the contact upsert performed per `smb_app_state_sync` action.
 * `actionAt` is Meta's `metadata.timestamp` — the last-writer-wins guard key.
 */
export interface WhatsappContactSyncInput {
  readonly accountId: string;
  readonly phoneNumber?: string | null;
  readonly userId?: string | null;
  readonly username?: string | null;
  readonly fullName?: string | null;
  readonly firstName?: string | null;
  readonly action: "add" | "remove";
  readonly actionAt: Date;
}

/**
 * List input for the paginated conversations query.
 *
 * `accountId` is tenant-scoped by the service layer: when present the caller
 * must already hold read access to that account; when absent the query spans
 * every active account the caller is permitted to see.
 */
export interface WhatsappConversationsListInput {
  readonly accountId?: string | null;
  readonly paginationArgs?: PaginationInput | null;
}

/**
 * Input for the paginated per-conversation message thread query.
 *
 * SECURITY: `conversationId` is client-supplied — the service layer MUST verify
 * the conversation belongs to an account of the caller's tenant before
 * returning any messages (IDOR guard).
 */
export interface WhatsappConversationMessagesInput {
  readonly conversationId: string;
  readonly paginationArgs?: PaginationInput | null;
}

/**
 * Paginated conversation list envelope for the inbox query. Not a table —
 * assembled by the inbox service from the repo list/count pair.
 */
export interface WhatsappConversationsPaginatedResult {
  /** Apollo cache key — scoped to the account filter (`whatsapp-conversations:<accountId|all>`). */
  readonly id: string;
  readonly rows: WhatsappConversationReturnType[];
  readonly totalCount: number;
  readonly pageInfo: PageInfo | null;
}

/** Paginated message thread envelope, mirror of the conversations envelope. */
export interface WhatsappConversationMessagesPaginatedResult {
  /** Apollo cache key — scoped to the thread (`whatsapp-messages:<conversationId>`). */
  readonly id: string;
  readonly rows: WhatsappMessageReturnType[];
  readonly totalCount: number;
  readonly pageInfo: PageInfo | null;
}
