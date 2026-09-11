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
 * Raw response body from `GET /{phone_number_id}` (Meta Graph API).
 *
 * Meta reports the messaging limit under
 * `whatsapp_business_manager_messaging_limit` (portfolio-scoped since Oct 2025),
 * while `messaging_limit_tier` remains populated as a legacy alias. The raw
 * shape is mapped to {@link GetPhoneNumberResult} by `mapPhoneNumberDetail` in
 * the get-phone-number request builder.
 */
export interface PhoneNumberDetailRaw {
  readonly id: string;
  readonly display_phone_number: string;
  readonly verified_name: string;
  readonly quality_rating: string;
  readonly throughput_level?: string;
  /** Portfolio-scoped messaging limit (post-Oct-2025 canonical field). */
  readonly whatsapp_business_manager_messaging_limit?: string;
  /** Legacy per-number messaging limit alias. */
  readonly messaging_limit_tier?: string;
  readonly max_conversations_per_24_hours?: number;
  readonly status?: string;
  readonly code_verification_status?: string;
}

/**
 * Phone number detail result produced by the get-phone-number request pipeline.
 *
 * `portfolio_messaging_limit_tier` is populated from Meta's
 * `whatsapp_business_manager_messaging_limit` / `messaging_limit_tier` fields and
 * stored verbatim — the enum value itself is never transformed.
 */
export interface GetPhoneNumberResult {
  readonly id: string;
  readonly display_phone_number: string;
  readonly verified_name: string;
  readonly quality_rating: string;
  readonly throughput_level: string;
  /** Meta tier enum, stored verbatim. */
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
 * Input for building a send-text-message Graph API request (free-text,
 * valid only inside the 24h customer service window).
 *
 * The success response body and parsed result are identical to the
 * send-template envelope — reuse `SendTemplateMessageResponseBody` /
 * `SendTemplateMessageResult` and the shared `parseSendTemplateResponse`.
 */
export interface SendTextMessageInput {
  /** Meta phone number ID (the sender's `phone_number_id`). */
  readonly phoneNumberId: string;
  /** Recipient WhatsApp number in E.164 format (digits only, no `+`). */
  readonly to: string;
  /** Free-text message body (1–4096 characters, Meta-enforced limit). */
  readonly body: string;
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

/**
 * Wire-level sync types accepted by `POST /{phone_number_id}/smb_app_data`.
 *
 * Meta accepts each value exactly once per coexistence onboarding, and only
 * within 24 hours of onboarding — the `whatsapp_sync_requests` ledger row
 * (unique per `(accountId, syncType)`) enforces this locally. The lowercase
 * wire values intentionally differ from the `WhatsappSyncType` DB enum
 * members; the coexistence sync service maps enum → wire at the boundary.
 */
export type RequestSmbAppDataSyncType = "smb_app_state_sync" | "history";

/**
 * Input for building an `smb_app_data` one-shot sync Graph API request
 * (`POST /{phone_number_id}/smb_app_data` on a coexistence number).
 */
export interface RequestSmbAppDataInput {
  /** Meta phone number ID of the coexistence-onboarded number. */
  readonly phoneNumberId: string;
  /** Which one-shot stream to request (contacts state, or 180-day history). */
  readonly syncType: RequestSmbAppDataSyncType;
}

/**
 * Response body from Meta on a successful `smb_app_data` sync request.
 * Acceptance only — `request_id` does not guarantee delivery; results arrive
 * asynchronously via `history` / `smb_app_state_sync` webhooks.
 */
export interface RequestSmbAppDataResponseBody {
  readonly messaging_product: string;
  readonly request_id?: string;
}

/** Parsed result of the `smb_app_data` accept response. */
export interface RequestSmbAppDataResult {
  /**
   * Meta-issued acceptance handle. Support/diagnostic correlation only —
   * follow-up webhooks never echo it, so nothing keys off it for idempotency.
   */
  readonly requestId: string;
}

// ─── Embedded Signup (coexistence onboarding) wire types ─────────────────────

/**
 * Input for exchanging an Embedded Signup authorization `code` for a
 * business-integration access token (`GET /oauth/access_token` with
 * `client_id` + `client_secret`). Credentials come from env-config, never
 * from client input.
 */
export interface ExchangeEmbeddedSignupCodeInput {
  /** Meta App ID (`WHATSAPP_APP_ID` env-config). */
  readonly appId: string;
  /** Meta App Secret (`WHATSAPP_APP_SECRET` env-config). */
  readonly appSecret: string;
  /** Single-use authorization code produced by the `FB.login` ES flow. */
  readonly code: string;
}

/** Response body of the Embedded Signup code exchange. */
export interface ExchangeEmbeddedSignupCodeResponseBody {
  readonly access_token?: string;
  readonly token_type?: string;
  readonly expires_in?: number;
}

/** Parsed result of the code exchange. */
export interface ExchangeEmbeddedSignupCodeResult {
  readonly accessToken: string;
}

/** Input for `POST /{waba_id}/subscribed_apps` (attach app to the WABA). */
export interface SubscribeAppToWabaInput {
  readonly wabaId: string;
}

/** Response body of the `subscribed_apps` subscription call. */
export interface SubscribedAppsResponseBody {
  readonly success?: boolean;
}

/**
 * Input for the coexistence platform confirmation call
 * (`GET /{phone_number_id}?fields=is_on_biz_app,platform_type,display_phone_number`).
 */
export interface GetPhoneNumberPlatformInput {
  readonly phoneNumberId: string;
}

/** Response body of the phone-number platform fields read. */
export interface GetPhoneNumberPlatformResponseBody {
  readonly id?: string;
  readonly display_phone_number?: string;
  readonly is_on_biz_app?: boolean;
  readonly platform_type?: string;
}

/**
 * Parsed coexistence-confirmation result. A number qualifies for coexistence
 * when `isOnBizApp` is true and `platformType` is `"CLOUD_API"`.
 */
export interface GetPhoneNumberPlatformResult {
  readonly displayPhoneNumber: string | null;
  readonly isOnBizApp: boolean;
  readonly platformType: string | null;
}
