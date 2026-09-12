/**
 * Graph API request builder: POST /{phone_number_id}/messages (type pin)
 *
 * Pins or unpins a message inside a WhatsApp group. `expirationDays` bounds
 * the pin lifetime (Meta-enforced 1–30 days) and is only sent for pin
 * operations — unpin accepts no expiration.
 *
 * The success envelope is identical to the message send envelope
 * (`{ messages: [{ id }] }`), so the parser reads `messages[0].id`.
 */

import {
  buildAuthHeaders,
  buildGraphUrl,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import type {
  GraphApiRequestContext,
  GraphApiRequestInit,
  PinGroupMessageInput,
  SendTemplateMessageResponseBody,
} from "@/backend/types";

/** Meta-enforced pin lifetime bounds in days. */
const MIN_PIN_EXPIRATION_DAYS = 1;
const MAX_PIN_EXPIRATION_DAYS = 30;

/**
 * Builds the fetch request for POST /{phone_number_id}/messages (type pin).
 * The adapter adds `AbortSignal.timeout(10_000)` before executing the `fetch`.
 */
export function buildPinGroupMessageRequest(
  ctx: GraphApiRequestContext,
  input: PinGroupMessageInput & { phoneNumberId: string }
): GraphApiRequestInit {
  // Validate inputs before interpolation
  // These are internal developer-facing validation errors caught by the adapter and wrapped into structured error codes
  if (!input.phoneNumberId || !/^\d+$/.test(input.phoneNumberId) || input.phoneNumberId.length > 64) {
    throw new Error("Invalid phoneNumberId: must be a non-empty numeric string ≤64 chars");
  }
  if (!input.groupId || input.groupId.length > 256) {
    throw new Error("Invalid groupId: must be non-empty and ≤256 chars");
  }
  if (!input.messageId) {
    throw new Error("Invalid messageId: must be non-empty");
  }
  if (input.operation !== "pin" && input.operation !== "unpin") {
    throw new Error('Invalid operation: must be "pin" or "unpin"');
  }

  if (input.operation === "pin") {
    if (input.expirationDays === undefined) {
      throw new Error('Invalid expirationDays: required when operation is "pin"');
    }
    if (
      !Number.isInteger(input.expirationDays) ||
      input.expirationDays < MIN_PIN_EXPIRATION_DAYS ||
      input.expirationDays > MAX_PIN_EXPIRATION_DAYS
    ) {
      throw new Error(
        `Invalid expirationDays: must be an integer between ${MIN_PIN_EXPIRATION_DAYS} and ${MAX_PIN_EXPIRATION_DAYS}`
      );
    }
  } else if (input.expirationDays !== undefined) {
    throw new Error('Invalid expirationDays: must be undefined when operation is "unpin"');
  }

  const url = buildGraphUrl(`/${input.phoneNumberId}/messages`, ctx.apiVersion);

  const pin: Record<string, unknown> = {
    type: input.operation,
    message_id: input.messageId,
  };
  if (input.operation === "pin") {
    pin.expiration_days = input.expirationDays;
  }

  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
    recipient_type: "group",
    to: input.groupId,
    type: "pin",
    pin,
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
 * Parses a successful (2xx) response body from the pin/unpin endpoint.
 * @throws {Error} if the response shape is unexpected (missing `messages[0].id`).
 */
export function parsePinGroupMessageResponse(body: SendTemplateMessageResponseBody): { messageId: string } {
  const messageId = body.messages?.[0]?.id;

  if (!messageId) {
    // Internal adapter error — not user-facing, no i18n needed (unexpected Meta API response shape)
    throw new Error("Graph API pin-group-message: missing messages[0].id in response");
  }

  return { messageId };
}
