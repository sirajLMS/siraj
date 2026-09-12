/**
 * Graph API request builder: POST /{phone_number_id}/messages (recipient_type group)
 *
 * Sends a message to a WhatsApp group — either a free-text `body` (inside the
 * 24h session window) or a pre-approved template. Group invite-link templates
 * carry the group binding as a BODY `group_id` template parameter, injected
 * at the wire level from the input's `template.groupIdParameter`.
 *
 * The success envelope is identical to the 1:1 send envelope
 * (`{ messages: [{ id }], contacts? }`), so this parser only extracts what
 * the body carries (`providerMessageId`) — the caller attaches the `groupId`
 * it already holds to complete {@link GroupMessageSendResult}.
 */

import {
  buildAuthHeaders,
  buildGraphUrl,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import type {
  GraphApiRequestContext,
  GraphApiRequestInit,
  GroupMessageSendResult,
  SendGroupMessageInput,
  SendTemplateMessageResponseBody,
  WhatsappTemplateComponent,
} from "@/backend/types";

/**
 * Builds the fetch request for POST /{phone_number_id}/messages
 * (recipient_type group). The adapter adds `AbortSignal.timeout(10_000)`
 * before executing the `fetch`.
 */
export function buildSendGroupMessageRequest(
  ctx: GraphApiRequestContext,
  input: SendGroupMessageInput & { phoneNumberId: string }
): GraphApiRequestInit {
  // Validate inputs before interpolation
  // These are internal developer-facing validation errors caught by the adapter and wrapped into structured error codes
  if (!input.phoneNumberId || !/^\d+$/.test(input.phoneNumberId) || input.phoneNumberId.length > 64) {
    throw new Error("Invalid phoneNumberId: must be a non-empty numeric string ≤64 chars");
  }
  if (!input.groupId || input.groupId.length > 256) {
    throw new Error("Invalid groupId: must be non-empty and ≤256 chars");
  }

  const url = buildGraphUrl(`/${input.phoneNumberId}/messages`, ctx.apiVersion);

  const body: Record<string, unknown> =
    input.type === "template" ? buildGroupTemplateBody(input) : buildGroupTextBody(input);

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
 * Builds the wire body for a free-text group send. `preview_url` defaults
 * to false when the input omits it.
 */
function buildGroupTextBody(input: SendGroupMessageInput): Record<string, unknown> {
  if (!input.text?.body) {
    throw new Error('Invalid group text send: "text.body" is required when type is "text"');
  }

  return {
    messaging_product: "whatsapp",
    recipient_type: "group",
    to: input.groupId,
    type: "text",
    text: {
      preview_url: input.text.previewUrl ?? false,
      body: input.text.body,
    },
  };
}

/**
 * Builds the wire body for a group template send. When
 * `template.groupIdParameter` is present (group invite-link templates), the
 * BODY component carries it as a `group_id` template parameter.
 */
function buildGroupTemplateBody(input: SendGroupMessageInput): Record<string, unknown> {
  const template = input.template;
  if (!template?.name) {
    throw new Error('Invalid group template send: "template.name" is required when type is "template"');
  }
  if (!template.languageCode) {
    throw new Error('Invalid group template send: "template.languageCode" is required when type is "template"');
  }

  const templateBody: Record<string, unknown> = {
    name: template.name,
    language: {
      code: template.languageCode,
    },
  };

  const components = buildGroupTemplateComponents(template.components, template.groupIdParameter);
  if (components) {
    templateBody.components = components;
  }

  return {
    messaging_product: "whatsapp",
    recipient_type: "group",
    to: input.groupId,
    type: "template",
    template: templateBody,
  };
}

/**
 * Assembles the template component list for a group send. The typed
 * {@link WhatsappTemplateComponent} parameter union does not include the
 * `group_id` variant, so the group binding is injected on a wire-level copy
 * of the BODY component rather than mutating the typed input.
 */
function buildGroupTemplateComponents(
  components: readonly WhatsappTemplateComponent[] | undefined,
  groupIdParameter: string | undefined
): readonly unknown[] | undefined {
  if (!groupIdParameter) {
    return components && components.length > 0 ? components : undefined;
  }

  const groupParameter = { type: "group_id", group_id: groupIdParameter };
  const wireComponents: unknown[] = components
    ? components.map(component => {
        if (component.type !== "body") {
          return component;
        }
        return { ...component, parameters: [...component.parameters, groupParameter] };
      })
    : [];

  if (!components?.some(component => component.type === "body")) {
    wireComponents.push({ type: "body", parameters: [groupParameter] });
  }

  return wireComponents;
}

/**
 * Parses a successful (2xx) response body from the group send endpoint.
 *
 * Only the body-carried field is returned — the response envelope does not
 * echo the target group, so the caller attaches the `groupId` it already
 * holds to complete {@link GroupMessageSendResult}.
 * @throws {Error} if the response shape is unexpected (missing `messages[0].id`).
 */
export function parseSendGroupMessageResponse(
  body: SendTemplateMessageResponseBody
): Pick<GroupMessageSendResult, "providerMessageId"> {
  const messageId = body.messages?.[0]?.id;

  if (!messageId) {
    // Internal adapter error — not user-facing, no i18n needed (unexpected Meta API response shape)
    throw new Error("Graph API send-group-message: missing messages[0].id in response");
  }

  return { providerMessageId: messageId };
}
