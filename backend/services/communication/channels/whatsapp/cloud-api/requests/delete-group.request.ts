/**
 * Graph API request builder: DELETE /{group_id}
 *
 * Deletes a WhatsApp group. No request body — Meta returns
 * `{ success: true }` on a settled delete, mirrored back by
 * {@link parseDeleteGroupResponse} as a boolean for symmetry with the
 * other group request builders.
 */

import {
  buildAuthHeaders,
  buildGraphUrl,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import type { GraphApiRequestContext, GraphApiRequestInit } from "@/backend/types";

/**
 * Builds the fetch request for DELETE /{group_id}.
 * The adapter adds `AbortSignal.timeout(10_000)` before executing.
 */
export function buildDeleteGroupRequest(ctx: GraphApiRequestContext, input: { groupId: string }): GraphApiRequestInit {
  // Validate groupId: opaque Meta token (base64, may include `=` padding) — no
  // self-encoding here; `buildGraphUrl` encodeURIComponent's each non-empty
  // path segment, which is correct for group IDs with special characters (r6-sec-02)
  if (!input.groupId || input.groupId.length > 256) {
    throw new Error("Invalid groupId: must be non-empty and ≤256 chars");
  }

  const url = buildGraphUrl(`/${input.groupId}`, ctx.apiVersion);

  return {
    url,
    init: {
      method: "DELETE",
      headers: buildAuthHeaders(ctx.accessToken),
    },
  };
}

/**
 * Parses a successful (2xx) response body from the delete-group endpoint.
 * Returns `true` only when Meta confirms the delete (`{ success: true }`).
 */
export function parseDeleteGroupResponse(body: { success?: boolean }): boolean {
  return body.success === true;
}
