/**
 * Graph API request builder: GET /{group_id}/invite_link
 *
 * Reads the current WhatsApp group invite link. The raw link is returned
 * verbatim — Meta does not guarantee a stable link prefix, so no URL
 * format validation is applied at parse time.
 */

import {
  buildAuthHeaders,
  buildGraphUrl,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import type { GraphApiRequestContext, GraphApiRequestInit, GroupInviteLinkRaw } from "@/backend/types";

/**
 * Builds the fetch request for GET /{group_id}/invite_link.
 * The adapter adds `AbortSignal.timeout(10_000)` before executing the `fetch`.
 */
export function buildGetGroupInviteLinkRequest(
  ctx: GraphApiRequestContext,
  input: { groupId: string }
): GraphApiRequestInit {
  // Validate inputs before interpolation
  // These are internal developer-facing validation errors caught by the adapter and wrapped into structured error codes
  if (!input.groupId || input.groupId.length > 256) {
    throw new Error("Invalid groupId: must be non-empty and ≤256 chars");
  }

  const url = buildGraphUrl(`/${input.groupId}/invite_link`, ctx.apiVersion);

  return {
    url,
    init: {
      method: "GET",
      headers: buildAuthHeaders(ctx.accessToken),
    },
  };
}

/**
 * Parses a successful (2xx) response body from the get-group-invite-link endpoint.
 * @throws {Error} if the response shape is unexpected (missing `invite_link`).
 */
export function parseGetGroupInviteLinkResponse(body: GroupInviteLinkRaw): { inviteLink: string } {
  if (!body.invite_link) {
    // Internal adapter error — not user-facing, no i18n needed (unexpected Meta API response shape)
    throw new Error("Graph API get-group-invite-link: missing invite_link in response");
  }
  return { inviteLink: body.invite_link };
}
