/**
 * Canonical type definitions for Meta Cloud API (Graph API v23.0) shared types.
 *
 * These types are used by request builders, the adapter, and the WhatsApp
 * account service. They live in the types layer so all backend layers can
 * import them from `@/backend/types/whatsapp/whatsapp-cloud-api.types`
 * without reaching into the service layer.
 *
 * Runtime helpers (buildGraphUrl, buildAuthHeaders, GraphApiError class)
 * remain in the service layer at
 * `backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers.ts`.
 */

import type { WhatsappTemplateComponent } from "@/backend/types";

/**
 * Runtime context passed to every request builder.
 * The adapter resolves all of these before calling a builder.
 */
export interface GraphApiRequestContext {
  /** Decrypted access token for the active WhatsApp Business Account. */
  readonly accessToken: string;
  /** Graph API version e.g. `"23.0"`. Falls back to the adapter's default if empty. */
  readonly apiVersion?: string;
}

/**
 * Standard `RequestInit` shape returned by all builders.
 * The adapter adds `AbortSignal.timeout(10_000)` before `fetch()`.
 */
export interface GraphApiRequestInit {
  readonly url: string;
  readonly init: RequestInit;
}

/**
 * Cursor-paginated response envelope used by Graph API list endpoints.
 * The `paging.next` URL cursor is followed until absent.
 */
export interface GraphApiPaginatedResponse<T> {
  readonly data: readonly T[];
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
 * Meta error shape inside a non-2xx response body:
 * `{ error: { message, code, type, fbtrace_id, ... } }`.
 */
export interface MetaErrorBody {
  readonly error: {
    readonly message: string;
    readonly code: number;
    readonly type?: string;
    readonly fbtrace_id?: string;
    readonly error_subcode?: number;
  };
}

/**
 * Phone number detail response from GET /{phone_number_id}.
 * Fields follow Meta's v23.0 Graph API (R2/R3/R8).
 *
 * `portfolioMessagingLimitTier` is stored verbatim (Q5) — no local mapping.
 */
export interface GetPhoneNumberResult {
  readonly id: string;
  readonly display_phone_number: string;
  readonly verified_name: string;
  readonly quality_rating: string;
  readonly throughput_level: string;
  /** Meta tier enum, stored verbatim (Q5). */
  readonly portfolio_messaging_limit_tier: string;
  readonly max_conversations_per_24_hours?: number;
  readonly status?: string;
  readonly code_verification_status?: string;
}

/**
 * Input for building a list-phone-numbers Graph API request.
 * The adapter (Task 5) resolves `wabaId`, `accessToken`, and `apiVersion`.
 */
export interface ListPhoneNumbersInput {
  /** The WhatsApp Business Account ID. */
  readonly wabaId: string;
}

/**
 * Phone number entry returned by the Graph API list endpoint.
 * Field names follow Meta's v23.0 API (R2/R3/R8 alignment).
 */
export interface WhatsappPhoneNumber {
  readonly id: string;
  readonly display_phone_number: string;
  readonly verified_name: string;
  readonly quality_rating?: string;
  readonly throughput_level?: string;
  readonly status?: string;
  readonly code_verification_status?: string;
}

/**
 * Input for building a list-message-templates Graph API request.
 * The adapter (Task 5) resolves `wabaId`, `accessToken`, and `apiVersion`.
 */
export interface ListMessageTemplatesInput {
  /** The WhatsApp Business Account ID. */
  readonly wabaId: string;
}

/**
 * A single message template entry from the list endpoint.
 *
 * `language.code` is carried verbatim for send-time resolution (B6) —
 * the send builder uses it as `template.language.code` in the POST body.
 */
export interface WhatsappMessageTemplate {
  readonly id: string;
  readonly name: string;
  readonly language: {
    /** Exact language code from Meta (e.g. `ar`, `en_US`, `ar_AR`). Stored verbatim (B6). */
    readonly code: string;
  };
  readonly status: string;
  readonly category: string;
  readonly components?: readonly unknown[];
  readonly created_time?: string;
}

/**
 * Input for building a send-template-message Graph API request.
 * The adapter (Task 5) resolves `phoneNumberId`, `accessToken`, and `apiVersion`
 * from env-config and account records before invoking `buildRequest`.
 */
export interface SendTemplateMessageInput {
  /** Meta phone number ID (the sender's `phone_number_id`). */
  readonly phoneNumberId: string;
  /** Recipient WhatsApp number in E.164 format (digits only, no `+`). */
  readonly to: string;
  /** Approved template name (from Meta Template Manager). */
  readonly templateName: string;
  /** Exact language code from the synced template payload (B6). */
  readonly languageCode: string;
  /** Optional component bindings for template variables/buttons. */
  readonly components?: readonly WhatsappTemplateComponent[];
}

/** Response body from Meta on a successful template send. */
export interface SendTemplateMessageResponseBody {
  readonly messaging_product: string;
  readonly contacts: readonly {
    readonly input: string;
    readonly wa_id: string;
  }[];
  readonly messages: readonly {
    readonly id: string;
  }[];
}

/** Parsed result from `parseResponse`. */
export interface SendTemplateMessageResult {
  /** The provider-assigned message ID (wamid). */
  readonly providerMessageId: string;
  /** The normalized WhatsApp ID (E.164 without `+`) of the recipient. */
  readonly recipientWaId: string;
}

/**
 * Parsed response from a single list-phone-numbers page.
 * Re-exported by the service-layer request builder for backward compatibility.
 */
export type ListPhoneNumbersResponseBody = GraphApiPaginatedResponse<WhatsappPhoneNumber>;

/**
 * Parsed response from a single list-message-templates page.
 * Re-exported by the service-layer request builder for backward compatibility.
 */
export type ListMessageTemplatesResponseBody = GraphApiPaginatedResponse<WhatsappMessageTemplate>;

/**
 * Input for building a get-phone-number Graph API request.
 * The adapter (Task 5) resolves the `phoneNumberId`, `accessToken`,
 * and `apiVersion`.
 */
export interface GetPhoneNumberInput {
  /** Meta phone number ID (not the E.164 display number). */
  readonly phoneNumberId: string;
}
