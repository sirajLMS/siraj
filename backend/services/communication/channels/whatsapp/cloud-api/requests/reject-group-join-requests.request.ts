/**
 * Graph API request builder: DELETE /{group_id}/join_requests (reject)
 *
 * Rejects one or more pending group join requests. This endpoint requires a
 * JSON body on DELETE — the builder sets `Content-Type: application/json`
 * alongside the auth headers and sends the body with the DELETE method.
 */

import {
  buildGroupJoinRequestsRequestInit,
  type GroupJoinRequestFailure,
  parseGroupJoinRequestsOutcome,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/__shared__";
import type { GraphApiRequestContext, GraphApiRequestInit, JoinRequestsOutcome } from "@/backend/types";

/**
 * Builds the fetch request for DELETE /{group_id}/join_requests (reject).
 * The adapter adds `AbortSignal.timeout(10_000)` before executing the `fetch`.
 */
export function buildRejectGroupJoinRequestsRequest(
  ctx: GraphApiRequestContext,
  input: { groupId: string; joinRequestIds: string[] }
): GraphApiRequestInit {
  return buildGroupJoinRequestsRequestInit(ctx, input, "DELETE");
}

/**
 * Parses a successful (2xx) response body from the reject join-requests
 * endpoint. Meta reports rejected requests under `rejected_join_requests`
 * and failures under `failed_join_requests` (each with per-request error
 * codes/messages).
 */
export function parseRejectGroupJoinRequestsResponse(body: {
  rejected_join_requests?: string[];
  failed_join_requests?: GroupJoinRequestFailure[];
}): JoinRequestsOutcome {
  return parseGroupJoinRequestsOutcome(undefined, body.failed_join_requests);
}
