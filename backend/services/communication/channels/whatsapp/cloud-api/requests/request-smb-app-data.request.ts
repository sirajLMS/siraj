/**
 * Graph API request builder: POST /{phone_number_id}/smb_app_data
 *
 * One-shot coexistence sync request. Meta accepts each `sync_type`
 * (`smb_app_state_sync` for contacts, `history` for the last 180 days of
 * 1:1 messages) exactly once per onboarding, and only within 24 hours of
 * onboarding. A `200` + `request_id` is acceptance, not delivery — results
 * stream in asynchronously via webhooks, and `request_id` is a
 * support-correlation handle only (webhooks never echo it).
 */

import {
  buildAuthHeaders,
  buildGraphUrl,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import type {
  GraphApiRequestContext,
  GraphApiRequestInit,
  RequestSmbAppDataInput,
  RequestSmbAppDataResponseBody,
  RequestSmbAppDataResult,
  RequestSmbAppDataSyncType,
} from "@/backend/types";

const VALID_SYNC_TYPES: ReadonlySet<RequestSmbAppDataSyncType> = new Set(["smb_app_state_sync", "history"]);

/**
 * Builds the fetch request for POST /{phone_number_id}/smb_app_data.
 * The caller adds `AbortSignal.timeout(...)` before executing the `fetch`.
 */
export function buildSmbAppDataRequest(
  ctx: GraphApiRequestContext,
  input: RequestSmbAppDataInput
): GraphApiRequestInit {
  // Internal developer-facing validation errors — caught by the caller and
  // wrapped into structured error codes.
  if (!input.phoneNumberId || input.phoneNumberId.length > 128) {
    throw new Error("Invalid phoneNumberId: must be non-empty and ≤128 chars");
  }
  if (!VALID_SYNC_TYPES.has(input.syncType)) {
    throw new Error("Invalid syncType: must be one of smb_app_state_sync | history");
  }

  const url = buildGraphUrl(`/${input.phoneNumberId}/smb_app_data`, ctx.apiVersion);

  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
    sync_type: input.syncType,
  };

  return {
    url,
    init: {
      method: "POST",
      headers: buildAuthHeaders(ctx.accessToken, true),
      body: JSON.stringify(body),
    },
  };
}

/**
 * Parses a successful (2xx) response body from the smb_app_data endpoint.
 * @throws {Error} if the response shape is unexpected (missing `request_id`).
 */
export function parseSmbAppDataResponse(body: RequestSmbAppDataResponseBody): RequestSmbAppDataResult {
  const requestId = typeof body?.request_id === "string" ? body.request_id : "";
  if (requestId.length === 0 || requestId.length > 128) {
    // Internal adapter error — not user-facing, no i18n needed (unexpected Meta API response shape)
    throw new Error("Graph API smb_app_data: missing request_id in response");
  }
  return { requestId };
}
