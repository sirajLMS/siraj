/**
 * Graph API request builder: POST /{phone_number_id}/groups
 *
 * Creates a WhatsApp group scoped to a Cloud API phone number. The subject is
 * Meta-enforced (1–128 characters) and the optional description is bounded at
 * 2048 characters. `join_approval_mode` selects how the group admits new
 * members and must match the synced {@link WhatsappGroupJoinApprovalMode}
 * enum values, never a hardcoded locale mapping.
 */

import { WhatsappGroupJoinApprovalMode } from "@/backend/enum/whatsapp/whatsapp-groups.enum";
import {
  buildAuthHeaders,
  buildGraphUrl,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import type {
  CreateGroupResponseBody,
  GraphApiRequestContext,
  GraphApiRequestInit,
  WhatsappCreateGroupInput,
} from "@/backend/types";

/**
 * Builds the fetch request for POST /{phone_number_id}/groups.
 * The adapter adds `AbortSignal.timeout(10_000)` before executing the `fetch`.
 */
export function buildCreateGroupRequest(
  ctx: GraphApiRequestContext,
  input: WhatsappCreateGroupInput & { phoneNumberId: string }
): GraphApiRequestInit {
  // Validate inputs before interpolation
  // These are internal developer-facing validation errors caught by the adapter and wrapped into structured error codes
  if (!input.phoneNumberId || input.phoneNumberId.length > 64 || !/^\d+$/.test(input.phoneNumberId)) {
    throw new Error("Invalid phoneNumberId: must be a non-empty numeric string ≤64 chars");
  }
  const subject = input.subject.trim();
  if (!subject || subject.length > 128) {
    throw new Error("Invalid subject: must be non-empty and ≤128 chars after trimming");
  }
  if (input.description !== undefined && input.description.length > 2048) {
    throw new Error("Invalid description: must be ≤2048 chars");
  }
  if (
    input.joinApprovalMode !== undefined &&
    input.joinApprovalMode !== WhatsappGroupJoinApprovalMode.ApprovalRequired &&
    input.joinApprovalMode !== WhatsappGroupJoinApprovalMode.AutoApprove
  ) {
    throw new Error("Invalid joinApprovalMode: must be approval_required or auto_approve");
  }

  const url = buildGraphUrl(`/${input.phoneNumberId}/groups`, ctx.apiVersion);

  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
    subject,
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.joinApprovalMode !== undefined ? { join_approval_mode: input.joinApprovalMode } : {}),
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
 * Parses a successful (2xx) response body from the create-group endpoint.
 * @throws {Error} if the response shape is unexpected (missing `id`).
 */
export function parseCreateGroupResponse(body: CreateGroupResponseBody): { groupId: string } {
  if (!body.id) {
    // Internal adapter error — not user-facing, no i18n needed (unexpected Meta API response shape)
    throw new Error("Graph API create-group: missing id in response");
  }

  return { groupId: body.id };
}
