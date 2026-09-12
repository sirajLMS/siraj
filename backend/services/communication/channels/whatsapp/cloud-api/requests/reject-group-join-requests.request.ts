/**
 * Graph API request builder: DELETE /{group_id}/join_requests (reject)
 *
 * Rejects one or more pending group join requests. This endpoint requires a
 * JSON body on DELETE — the builder sets `Content-Type: application/json`
 * alongside the auth headers and sends the body with the DELETE method.
 */

import {
  buildAuthHeaders,
  buildGraphUrl,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import type { GraphApiRequestContext, GraphApiRequestInit, JoinRequestsOutcome } from "@/backend/types";

/**
 * Builds the fetch request for DELETE /{group_id}/join_requests (reject).
 * The adapter adds `AbortSignal.timeout(10_000)` before executing the `fetch`.
 */
export function buildRejectGroupJoinRequestsRequest(
  ctx: GraphApiRequestContext,
  input: { groupId: string; joinRequestIds: string[] }
): GraphApiRequestInit {
  // Validate inputs before interpolation
  // These are internal developer-facing validation errors caught by the adapter and wrapped into structured error codes
  if (!input.groupId || input.groupId.length > 128) {
    throw new Error("Invalid groupId: must be non-empty and ≤128 chars");
  }
  if (!Array.isArray(input.joinRequestIds) || input.joinRequestIds.length === 0) {
    throw new Error("Invalid joinRequestIds: must be a non-empty array");
  }
  if (input.joinRequestIds.some(id => !id || id.length === 0)) {
    throw new Error("Invalid joinRequestIds: every entry must be a non-empty string");
  }

  const url = buildGraphUrl(`/${input.groupId}/join_requests`, ctx.apiVersion);

  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
    join_requests: input.joinRequestIds,
  };

  return {
    url,
    init: {
      method: "DELETE",
      headers: buildAuthHeaders(ctx.accessToken, true),
      body: JSON.stringify(body),
    },
  };
}

/**
 * Parses a successful (2xx) response body from the reject join-requests
 * endpoint. Meta reports rejected requests under `rejected_join_requests`
 * and failures under `failed_join_requests` (each with per-request error
 * codes/messages).
 */
export function parseRejectGroupJoinRequestsResponse(body: {
  rejected_join_requests?: string[];
  failed_join_requests?: {
    join_request_id: string;
    errors?: { code?: number; message?: string }[];
  }[];
}): JoinRequestsOutcome {
  return {
    approved: [],
    failed: (body.failed_join_requests ?? []).map(failure => ({
      joinRequestId: failure.join_request_id,
      errors: (failure.errors ?? []).map(error => ({
        code: error.code,
        message: error.message,
      })),
    })),
  };
}
