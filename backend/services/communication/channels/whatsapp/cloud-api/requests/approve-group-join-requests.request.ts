/**
 * Graph API request builder: POST /{group_id}/join_requests (approve)
 *
 * Approves one or more pending group join requests. Note: Meta may respond
 * with HTTP 206 (partial success) when only some requests are approved —
 * {@link parseApproveGroupJoinRequestsResponse} handles the body regardless
 * of status; 206 means only part of the batch settled.
 */

import {
  buildGroupJoinRequestsRequestInit,
  type GroupJoinRequestFailure,
  parseGroupJoinRequestsOutcome,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/__shared__";
import type { GraphApiRequestContext, GraphApiRequestInit, JoinRequestsOutcome } from "@/backend/types";

/**
 * Builds the fetch request for POST /{group_id}/join_requests (approve).
 * The adapter adds `AbortSignal.timeout(10_000)` before executing the `fetch`.
 */
export function buildApproveGroupJoinRequestsRequest(
  ctx: GraphApiRequestContext,
  input: { groupId: string; joinRequestIds: string[] }
): GraphApiRequestInit {
  return buildGroupJoinRequestsRequestInit(ctx, input, "POST");
}

/**
 * Parses a successful (2xx or 206 partial-success) response body from the
 * approve join-requests endpoint. Meta reports settled requests under
 * `approved_join_requests` and failures under `failed_join_requests`
 * (each with per-request error codes/messages).
 */
export function parseApproveGroupJoinRequestsResponse(body: {
  approved_join_requests?: string[];
  failed_join_requests?: GroupJoinRequestFailure[];
}): JoinRequestsOutcome {
  return parseGroupJoinRequestsOutcome(body.approved_join_requests, body.failed_join_requests);
}
