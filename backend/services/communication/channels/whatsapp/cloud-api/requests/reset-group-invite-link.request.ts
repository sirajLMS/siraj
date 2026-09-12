/**
 * Graph API request builder: POST /{group_id}/invite_link (reset)
 *
 * Revokes the current WhatsApp group invite link and issues a new one.
 * Resetting invalidates every previously shared link — callers must
 * re-read the link with the get-group-invite-link builder afterwards.
 */

import {
  buildAuthHeaders,
  buildGraphUrl,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import type { GraphApiRequestContext, GraphApiRequestInit, GroupInviteLinkRaw } from "@/backend/types";

/**
 * Builds the fetch request for POST /{group_id}/invite_link (reset).
 * The adapter adds `AbortSignal.timeout(10_000)` before executing the `fetch`.
 */
export function buildResetGroupInviteLinkRequest(
  ctx: GraphApiRequestContext,
  input: { groupId: string }
): GraphApiRequestInit {
  // Validate inputs before interpolation
  // These are internal developer-facing validation errors caught by the adapter and wrapped into structured error codes
  if (!input.groupId || input.groupId.length > 256) {
    throw new Error("Invalid groupId: must be non-empty and ≤256 chars");
  }

  const url = buildGraphUrl(`/${input.groupId}/invite_link`, ctx.apiVersion);

  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
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
 * Parses a successful (2xx) response body from the reset-group-invite-link
 * endpoint. Meta returns the regenerated link under `invite_link`.
 * @throws {Error} if the response shape is unexpected (missing `invite_link`).
 */
export function parseResetGroupInviteLinkResponse(body: GroupInviteLinkRaw): { inviteLink: string } {
  if (!body.invite_link) {
    // Internal adapter error — not user-facing, no i18n needed (unexpected Meta API response shape)
    throw new Error("Graph API reset-group-invite-link: missing invite_link in response");
  }
  return { inviteLink: body.invite_link };
}
