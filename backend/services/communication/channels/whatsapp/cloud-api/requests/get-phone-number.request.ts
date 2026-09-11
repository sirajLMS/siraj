/**
 * Graph API request builder: GET /{phone_number_id}
 *
 * Fetches detailed metadata for a single WhatsApp phone number, including the
 * messaging-limit tier. Meta reports the tier under
 * `whatsapp_business_manager_messaging_limit` (portfolio-scoped, post-Oct-2025)
 * with `messaging_limit_tier` as a legacy alias — both are requested (Q5).
 *
 * The adapter uses this builder during `syncWhatsappAccountsFromMeta` to
 * enrich the bulk list response with per-number tier details (REQ-4.2).
 */

import {
  buildAuthHeaders,
  buildGraphUrl,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import type {
  GetPhoneNumberInput,
  GetPhoneNumberResult,
  GraphApiRequestContext,
  GraphApiRequestInit,
  PhoneNumberDetailRaw,
} from "@/backend/types";

/**
 * Builds the fetch request for GET /{phone_number_id}.
 * The adapter adds `AbortSignal.timeout(10_000)` before executing.
 */
export function buildGetPhoneNumberRequest(
  ctx: GraphApiRequestContext,
  input: GetPhoneNumberInput
): GraphApiRequestInit {
  // Validate phoneNumberId: numeric string, reasonable max length (r6-sec-02)
  if (!input.phoneNumberId || input.phoneNumberId.length > 64 || !/^\d+$/.test(input.phoneNumberId)) {
    // Internal startup error — not user-facing, no i18n needed (invalid config input)
    throw new Error("Invalid phoneNumberId: must be a non-empty numeric string ≤64 chars");
  }

  // Request the fields the parser (`phoneNumberResultSchema`) consumes. Meta
  // omits `status` (and several others) from the default field set, so without
  // this `fields` param `status` is always `undefined` and callers derive
  // `isConnected=false` → `isActive=false` even for a CONNECTED number. The
  // messaging-limit tier is likewise opt-in and must be requested explicitly.
  const url = buildGraphUrl(
    `/${input.phoneNumberId}`,
    ctx.apiVersion,
    "?fields=code_verification_status,display_phone_number,id,quality_rating,status,verified_name,messaging_limit_tier,whatsapp_business_manager_messaging_limit"
  );

  return {
    url,
    init: {
      method: "GET",
      headers: buildAuthHeaders(ctx.accessToken),
    },
  };
}

/**
 * Maps a raw `GET /{phone_number_id}` response into the canonical
 * {@link GetPhoneNumberResult} shape.
 *
 * Meta returns the messaging limit under `whatsapp_business_manager_messaging_limit`
 * (portfolio-scoped, post-Oct-2025) with `messaging_limit_tier` as a legacy
 * alias. Both are accepted; the stored `portfolio_messaging_limit_tier` value is
 * kept verbatim (Q5) — the enum string itself is never transformed.
 */
export function mapPhoneNumberDetail(raw: PhoneNumberDetailRaw): GetPhoneNumberResult {
  return {
    id: raw.id,
    display_phone_number: raw.display_phone_number,
    verified_name: raw.verified_name,
    quality_rating: raw.quality_rating,
    throughput_level: raw.throughput_level ?? "STANDARD",
    portfolio_messaging_limit_tier:
      raw.whatsapp_business_manager_messaging_limit ?? raw.messaging_limit_tier ?? "TIER_NOT_SET",
    max_conversations_per_24_hours: raw.max_conversations_per_24_hours,
    status: raw.status,
    code_verification_status: raw.code_verification_status,
  };
}

/**
 * Parses a successful (2xx) response body from the get-phone-number endpoint
 * into the canonical result shape (delegates to {@link mapPhoneNumberDetail}).
 */
export function parseGetPhoneNumberResponse(body: PhoneNumberDetailRaw): GetPhoneNumberResult {
  return mapPhoneNumberDetail(body);
}
