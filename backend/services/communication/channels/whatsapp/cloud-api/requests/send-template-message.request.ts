/**
 * Graph API request builder: POST /{phone_number_id}/messages (type template)
 *
 * Sends a pre-approved template message to a WhatsApp recipient.
 * v1 is template-only (B1) — no free-text `body` field outside the 24h session window.
 * The `template.language.code` MUST come from the synced list-message-templates
 * payload (B6), never hardcoded locale mapping.
 */

import {
  buildAuthHeaders,
  buildGraphUrl,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import type {
  GraphApiRequestContext,
  GraphApiRequestInit,
  SendTemplateMessageInput,
  SendTemplateMessageResult,
} from "@/backend/types";

/**
 * Builds the fetch request for POST /{phone_number_id}/messages (type template).
 * The adapter adds `AbortSignal.timeout(10_000)` before executing the `fetch`.
 */
export function buildSendTemplateMessageRequest(
  ctx: GraphApiRequestContext,
  input: SendTemplateMessageInput
): GraphApiRequestInit {
  // Validate inputs before interpolation
  // These are internal developer-facing validation errors caught by the adapter and wrapped into structured error codes
  if (!input.phoneNumberId || input.phoneNumberId.length > 128) {
    throw new Error("Invalid phoneNumberId: must be non-empty and ≤128 chars");
  }
  if (!input.to || input.to.length > 32 || !/^\d+$/.test(input.to)) {
    throw new Error("Invalid recipient to: must be non-empty numeric string ≤32 chars");
  }
  if (!input.templateName || input.templateName.length > 256) {
    throw new Error("Invalid templateName: must be non-empty and ≤256 chars");
  }
  if (!/^\w+$/.test(input.templateName)) {
    throw new Error("Template name must contain only alphanumeric characters and underscores");
  }

  const url = buildGraphUrl(`/${input.phoneNumberId}/messages`, ctx.apiVersion);

  const template: Record<string, unknown> = {
    name: input.templateName,
    language: {
      code: input.languageCode,
    },
  };

  if (input.components && input.components.length > 0) {
    template.components = input.components;
  }

  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
    to: input.to,
    type: "template",
    template,
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
 * Parses a successful (2xx) response body from the send-template-message endpoint.
 * Accepts `unknown` (the raw JSON value) and narrows at runtime — the body is
 * now read through the byte-budget guard in the adapter, so it arrives as
 * untyped JSON.
 * @throws {Error} if the response shape is unexpected (missing `messages[0].id`).
 */
export function parseSendTemplateResponse(body: unknown): SendTemplateMessageResult {
  const parsed = typeof body === "object" && body !== null ? body : null;
  const messages = parsed && "messages" in parsed && Array.isArray(parsed.messages) ? parsed.messages : [];
  const contacts = parsed && "contacts" in parsed && Array.isArray(parsed.contacts) ? parsed.contacts : [];
  const firstMessage = messages[0];
  const firstContact = contacts[0];
  const messageId =
    typeof firstMessage === "object" &&
    firstMessage !== null &&
    "id" in firstMessage &&
    typeof firstMessage.id === "string"
      ? firstMessage.id
      : undefined;
  const waId =
    typeof firstContact === "object" &&
    firstContact !== null &&
    "wa_id" in firstContact &&
    typeof firstContact.wa_id === "string"
      ? firstContact.wa_id
      : undefined;

  if (!messageId) {
    // Internal adapter error — not user-facing, no i18n needed (unexpected Meta API response shape)
    throw new Error("Graph API send-template-message: missing messages[0].id in response");
  }

  return {
    providerMessageId: messageId,
    recipientWaId: waId ?? "",
  };
}
