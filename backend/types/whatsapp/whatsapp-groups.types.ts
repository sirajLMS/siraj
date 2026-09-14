import type { whatsappGroupMessages, whatsappGroupParticipants, whatsappGroups } from "@/backend/db/schema";
import type { WhatsappGroupJoinApprovalMode } from "@/backend/enum/whatsapp/whatsapp-groups.enum";
import type { WhatsappMessageDirection } from "@/backend/enum/whatsapp/whatsapp-inbox.enum";
import type { WhatsappTemplateComponent } from "@/backend/types";
import type { PageInfo, PaginationInput } from "@/backend/types/shared/pagination.types";

/**
 * Canonical type definitions for WhatsApp Groups (Meta WhatsApp Cloud API
 * Groups).
 *
 * Wire types follow the Graph API request/response shapes from
 * `whatsapp-cloud-api.types.ts`; service types follow the DB-derived
 * `$inferSelect`/`$inferInsert` + `ReturnType` pattern. Request builders
 * receive the shared {@link GraphApiRequestContext} — it is never redefined
 * here.
 */

// ─── Graph API wire types (request/response bodies) ─────────────────────────

/**
 * Body for building a create-group Graph API request
 * (`POST /{waba_id}/groups`).
 */
export interface WhatsappCreateGroupInput {
  /** Group subject (1–128 characters, Meta-enforced limit). */
  readonly subject: string;
  /** Optional group description. */
  readonly description?: string;
  /** How the group admits new members. */
  readonly joinApprovalMode?: WhatsappGroupJoinApprovalMode;
}

/**
 * Response body from Meta on a successful group create. Meta returns the
 * group id under `id` (the messaging product envelope is optional).
 */
export interface CreateGroupResponseBody {
  readonly id: string;
  readonly messaging_product?: string;
}

/**
 * Raw response body from `GET /{group_id}` (Meta Graph API).
 *
 * Field names follow Meta's snake_case wire shape; the canonical
 * {@link GroupInfo} mapped type is produced by the group request builder.
 */
export interface GroupInfoRaw {
  readonly id: string;
  readonly subject: string;
  readonly description?: string;
  readonly join_approval_mode: string;
  readonly suspended?: boolean;
  readonly creation_timestamp?: string;
  readonly total_participant_count?: number;
  readonly participants?: readonly {
    readonly wa_id: string;
  }[];
}

/**
 * Canonical mapped shape of a group detail read. Produced from
 * {@link GroupInfoRaw} by the get-group request pipeline — snake_case wire
 * fields are converted to camelCase and the participant list is reduced to
 * `participantWaIds`.
 */
export interface GroupInfo {
  readonly groupId: string;
  readonly subject: string;
  readonly description?: string;
  readonly joinApprovalMode: WhatsappGroupJoinApprovalMode;
  readonly suspended?: boolean;
  readonly creationTimestamp?: string;
  readonly totalParticipantCount?: number;
  readonly participantWaIds: readonly string[];
}

/**
 * Raw response body from the list-groups Graph API endpoint.
 * The `paging.next` URL cursor is followed until absent.
 */
export interface ListGroupsRaw {
  readonly data: {
    readonly groups: readonly {
      readonly id: string;
      readonly subject: string;
      readonly created_at?: string;
    }[];
  };
  readonly paging?: {
    readonly cursors?: {
      readonly before?: string;
      readonly after?: string;
    };
    readonly next?: string;
    readonly previous?: string;
  };
}

/** Response body from the group invite-link read. */
export interface GroupInviteLinkRaw {
  readonly messaging_product?: string;
  readonly invite_link: string;
}

/** One pending join request from the group join-requests list endpoint. */
interface GroupJoinRequestRaw {
  readonly join_request_id: string;
  readonly wa_id: string;
  readonly creation_timestamp: string;
}

/** Raw response body from the group join-requests list endpoint. */
export interface GroupJoinRequestsListRaw {
  readonly data: readonly GroupJoinRequestRaw[];
  readonly paging?: {
    readonly cursors?: {
      readonly before?: string;
      readonly after?: string;
    };
    readonly next?: string;
    readonly previous?: string;
  };
}

/**
 * Aggregated outcome of approve/reject join-request calls: Meta reports
 * settled requests under `approved_join_requests` / `rejected_join_requests`
 * and failures under `failed_join_requests` (each with per-request error
 * codes/messages).
 */
export interface JoinRequestsOutcome {
  readonly approved: readonly string[];
  readonly failed: readonly WhatsappJoinRequestFailureType[];
}

/**
 * One per-request error reported by Meta on a failed approve/reject
 * join-requests call. Shares the same per-participant error shape Meta uses
 * on remove-participants failures.
 */
export type WhatsappJoinRequestErrorType = WhatsappRemoveParticipantErrorType;

/**
 * One failed approve/reject join-requests entry: the Meta join-request ID
 * that failed alongside Meta's per-request error codes/messages.
 */
export interface WhatsappJoinRequestFailureType {
  readonly joinRequestId: string;
  readonly errors: readonly WhatsappJoinRequestErrorType[];
}

/**
 * One per-participant error reported by Meta on a failed remove-participants
 * call.
 */
export interface WhatsappRemoveParticipantErrorType {
  readonly code?: number;
  readonly message?: string;
}

/**
 * One failed remove-participants entry: the normalized participant input that
 * failed alongside Meta's per-participant error codes/messages.
 */
export interface WhatsappRemoveParticipantFailureType {
  readonly input: string;
  readonly errors: readonly WhatsappRemoveParticipantErrorType[];
}

/**
 * Aggregated outcome of a remove-participants call: Meta reports settled
 * participants under the removed list and failures under
 * `failed_participants` (each with per-participant error codes/messages).
 */
export interface RemoveParticipantsOutcome {
  readonly removed: readonly string[];
  readonly failed: readonly WhatsappRemoveParticipantFailureType[];
}

/**
 * Input for building a send-group-message Graph API request. The `type`
 * field gates the required payload: `"text"` requires `text` (free-text
 * body), `"template"` requires `template` (approved template name +
 * language code).
 */
export interface SendGroupMessageInput {
  /** Meta group id (the `id` returned by the group create/read endpoints). */
  readonly groupId: string;
  readonly messagingProduct?: string;
  readonly type: "text" | "template";
  /** Present when `type` is `"text"`. */
  readonly text?: {
    readonly body: string;
    readonly previewUrl?: boolean;
  };
  /** Present when `type` is `"template"`. */
  readonly template?: {
    readonly name: string;
    readonly languageCode: string;
    readonly components?: readonly WhatsappTemplateComponent[];
    readonly groupIdParameter?: string;
  };
}

/**
 * Input for building a pin/unpin-group-message Graph API request.
 * `operation` selects the pin or unpin action; `expirationDays` bounds the
 * pin lifetime (Meta-enforced maximum).
 */
export interface PinGroupMessageInput {
  readonly groupId: string;
  readonly messageId: string;
  readonly operation: "pin" | "unpin";
  readonly expirationDays?: number;
}

/** Parsed result of a successful group message send. */
export interface GroupMessageSendResult {
  /** The provider-assigned message ID (wamid). */
  readonly providerMessageId: string;
  /** The group id the message was sent to. */
  readonly groupId: string;
}

// ─── Service / DB-derived types ──────────────────────────────────────────────

export type WhatsappGroupSelectType = typeof whatsappGroups.$inferSelect;
export type WhatsappGroupInsertType = typeof whatsappGroups.$inferInsert;

export type WhatsappGroupReturnType = Omit<WhatsappGroupSelectType, "joinApprovalMode"> & {
  joinApprovalMode: WhatsappGroupJoinApprovalMode; // Re-apply enum
};

export type WhatsappGroupParticipantSelectType = typeof whatsappGroupParticipants.$inferSelect;
export type WhatsappGroupParticipantInsertType = typeof whatsappGroupParticipants.$inferInsert;

export type WhatsappGroupParticipantReturnType = Omit<WhatsappGroupParticipantSelectType, never>;

export type WhatsappGroupMessageSelectType = typeof whatsappGroupMessages.$inferSelect;
export type WhatsappGroupMessageInsertType = typeof whatsappGroupMessages.$inferInsert;

export type WhatsappGroupMessageReturnType = Omit<WhatsappGroupMessageSelectType, "direction" | "content"> & {
  direction: WhatsappMessageDirection; // Re-apply enum
  /** Per-message-type payload (`text`, `image`, `media_placeholder`, …). Always a JSON object. */
  content: Record<string, unknown>;
};

/**
 * Input for the group create service/mutation. `accountId` scopes the group
 * to the owning WhatsApp account; the (accountId, groupJid) pair is unique
 * per Meta's constraint on the underlying table.
 */
export interface WhatsappGroupCreateInput {
  readonly accountId: string;
  readonly subject: string;
  readonly description?: string;
  readonly joinApprovalMode?: WhatsappGroupJoinApprovalMode;
}

/**
 * Input for the group settings update service/mutation.
 * `subject`/`description` map to Graph API group settings updates;
 * `profilePicturePath` is a local file path staged for multipart upload to
 * Meta's media endpoint.
 */
export interface WhatsappGroupSettingsUpdateInput {
  readonly groupId: string;
  readonly subject?: string;
  readonly description?: string;
  readonly profilePicturePath?: string;
  /** Caller performing the mutation (resolved from GraphQL ctx by the service layer). */
  readonly actorUserId: string;
}

/**
 * List input for the paginated groups query.
 *
 * `accountId` is tenant-scoped by the service layer: when present the caller
 * must already hold read access to that account; when absent the query spans
 * every active account the caller is permitted to see. `search` filters by
 * group subject.
 */
export interface WhatsappGroupsListInput {
  readonly accountId?: string | null;
  readonly search?: string;
  readonly paginationArgs?: PaginationInput | null;
}

/**
 * Input for the paginated per-group message thread query.
 *
 * SECURITY: `groupId` is client-supplied — the service layer MUST verify the
 * group belongs to an account of the caller's tenant before returning any
 * messages (IDOR guard).
 */
export interface WhatsappGroupMessagesListInput {
  readonly groupId: string;
  readonly paginationArgs?: PaginationInput | null;
}

/**
 * Paginated group list envelope for the groups query. Not a table —
 * assembled by the groups service from the repo list/count pair.
 */
export interface WhatsappGroupsPaginatedResult {
  /** Apollo cache key — scoped to the account filter (`whatsapp-groups:<accountId|all>`). */
  readonly id: string;
  readonly rows: WhatsappGroupReturnType[];
  readonly totalCount: number;
  readonly pageInfo: PageInfo | null;
}

/** Paginated group message thread envelope, mirror of the groups envelope. */
export interface WhatsappGroupMessagesPaginatedResult {
  /** Apollo cache key — scoped to the thread (`whatsapp-group-messages:<groupId>`). */
  readonly id: string;
  readonly rows: WhatsappGroupMessageReturnType[];
  readonly totalCount: number;
  readonly pageInfo: PageInfo | null;
}

/** Canonical mapped shape of one pending group join request. */
export interface WhatsappGroupJoinRequest {
  readonly joinRequestId: string;
  readonly waId: string;
  readonly creationTimestamp: string;
}

/**
 * Input for the groups `sendGroupMessage` service/mutation. The service
 * resolves the mode from the payload: `text` present → free-text send
 * (subject to group participation), `templateName` present → template send.
 */
export interface WhatsappGroupSendInput {
  readonly groupId: string;
  /** Free-text message body (1–4096 characters, Meta-enforced limit). */
  readonly text?: {
    readonly body: string;
    readonly previewUrl?: boolean;
  };
  /** Approved template name (from Meta Template Manager). */
  readonly templateName?: string;
  /** Exact language code from the synced template payload. */
  readonly templateLanguageCode?: string;
  /** Optional component bindings for template variables/buttons. */
  readonly templateComponents?: readonly WhatsappTemplateComponent[];
  /** Optional group-id template parameter binding. */
  readonly templateGroupIdParameter?: string;
  /** Caller performing the send (resolved from GraphQL ctx by the service layer). */
  readonly actorUserId: string;
}

/**
 * Input for the group join-request approval service/mutation. `joinRequestIds`
 * are the Meta join-request IDs from the pending list; the provider's parsed
 * outcome (approved list + per-request failures) is returned verbatim — local
 * membership reconciliation is left to the `group_participants_update`
 * webhook.
 */
export interface ApproveWhatsappGroupJoinRequestsInput {
  /** Caller performing the mutation (resolved from GraphQL ctx by the service layer). */
  readonly actorUserId: string;
  readonly groupId: string;
  readonly joinRequestIds: string[];
}

/**
 * Input for the groups pin/unpin service/mutation. `operation` selects the
 * pin or unpin action; `expirationDays` bounds the pin lifetime.
 */
export interface WhatsappGroupPinInput {
  readonly groupId: string;
  readonly messageId: string;
  readonly operation: "pin" | "unpin";
  readonly expirationDays?: number;
  /** Caller performing the mutation (resolved from GraphQL ctx by the service layer). */
  readonly actorUserId: string;
}

/**
 * Input for the groups reject-join-requests service/mutation. `joinRequestIds`
 * are the pending request ids from the group join-requests list; the parsed
 * per-request failure outcome is reconciled asynchronously by the
 * `group_participants_update` webhook.
 */
export interface RejectWhatsappGroupJoinRequestsInput {
  readonly groupId: string;
  readonly joinRequestIds: string[];
  /** Caller performing the mutation (resolved from GraphQL ctx by the service layer). */
  readonly actorUserId: string;
}

/**
 * Input for the groups unpin service/mutation. Unpin has no expiry — the
 * `expirationDays` bound only applies to pins.
 */
export interface UnpinWhatsappGroupMessageInput {
  readonly groupId: string;
  readonly messageId: string;
  /** Caller performing the mutation (resolved from GraphQL ctx by the service layer). */
  readonly actorUserId: string;
}

/**
 * Input for the groups remove-participants service/mutation. Meta is the
 * authority on group membership — the removed/failed outcome arrives
 * asynchronously via the `group_participants_update` webhook, so this input
 * carries only the target group and the participant list to remove.
 */
export interface RemoveWhatsappGroupParticipantsInput {
  readonly groupId: string;
  readonly participants: string[];
  /** Caller performing the mutation (resolved from GraphQL ctx by the service layer). */
  readonly actorUserId: string;
}

/**
 * Input for the Meta-side groups sync service/mutation. `accountId` scopes
 * the sync to one account when given; otherwise the service resolves the
 * active GENERAL-purpose account (falling back to the first active account).
 */
export interface SyncWhatsappGroupsInput {
  readonly accountId?: string | null;
  /** Caller performing the mutation (resolved from GraphQL ctx by the service layer). */
  readonly actorUserId: string;
}

/**
 * Input for the groups delete service/mutation. The Meta delete must succeed
 * before the local row is soft-deleted, so this input only names the target
 * group.
 */
export interface DeleteWhatsappGroupInput {
  readonly groupId: string;
  /** Caller performing the mutation (resolved from GraphQL ctx by the service layer). */
  readonly actorUserId: string;
}

/**
 * Service input for the groups create mutation: the canonical
 * {@link WhatsappGroupCreateInput} plus the caller performing the mutation
 * (resolved from GraphQL ctx by the service layer).
 */
export interface WhatsappGroupCreateServiceInput extends WhatsappGroupCreateInput {
  /** Caller performing the mutation (resolved from GraphQL ctx by the service layer). */
  readonly actorUserId: string;
}
