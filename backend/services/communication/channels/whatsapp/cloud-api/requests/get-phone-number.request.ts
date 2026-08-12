/**
 * Graph API request builder: GET /{phone_number_id}
 *
 * Fetches detailed metadata for a single WhatsApp phone number, including
 * `portfolioMessagingLimitTier` which SHALL store Meta's enum verbatim
 * (`UNTIERED / TIER_50 / TIER_250 / TIER_1K / TIER_10K / TIER_100K /
 * TIER_UNLIMITED / TIER_NOT_SET`) with no transformation (Q5).
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

  const url = buildGraphUrl(`/${input.phoneNumberId}`, ctx.apiVersion);

  return {
    url,
    init: {
      method: "GET",
      headers: buildAuthHeaders(ctx.accessToken),
    },
  };
}

/**
 * Parses a successful (2xx) response body from the get-phone-number endpoint.
 *
 * The adapter must NOT transform `portfolioMessagingLimitTier` — it is stored
 * as-is from Meta's response (Q5).
 */
export function parseGetPhoneNumberResponse(body: GetPhoneNumberResult): GetPhoneNumberResult {
  return body;
}
