/**
 * Graph API request builder: POST /{phone_number_id}/messages (type text)
 *
 * Sends a free-text WhatsApp message. Text sends are only accepted by Meta
 * inside the 24h customer service window — the conversations service
 * enforces that window before invoking this builder.
 *
 * The success envelope is identical to send-template-message
 * (`{ contacts, messages: [{ id }] }`), so responses are parsed with the
 * shared `parseSendTemplateResponse` — no duplicate parser here.
 */

import {
  buildAuthHeaders,
  buildGraphUrl,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import type { GraphApiRequestContext, GraphApiRequestInit, SendTextMessageInput } from "@/backend/types";

/**
 * Builds the fetch request for POST /{phone_number_id}/messages (type text).
 * The adapter adds `AbortSignal.timeout(10_000)` before executing the `fetch`.
 */
export function buildSendTextMessageRequest(
  ctx: GraphApiRequestContext,
  input: SendTextMessageInput
): GraphApiRequestInit {
  // Validate inputs before interpolation
  // These are internal developer-facing validation errors caught by the adapter and wrapped into structured error codes
  if (!input.phoneNumberId || input.phoneNumberId.length > 128) {
    throw new Error("Invalid phoneNumberId: must be non-empty and ≤128 chars");
  }
  if (!input.to || input.to.length > 32 || !/^\d+$/.test(input.to)) {
    throw new Error("Invalid recipient to: must be non-empty numeric string ≤32 chars");
  }
  if (!input.body.trim() || input.body.length > 4096) {
    throw new Error("Invalid body: must be non-empty and ≤4096 chars");
  }

  const url = buildGraphUrl(`/${input.phoneNumberId}/messages`, ctx.apiVersion);

  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: input.to,
    type: "text",
    text: {
      preview_url: false,
      body: input.body,
    },
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
