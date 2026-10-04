/**
 * Shared plumbing for the group join-request approve/reject request builders:
 * input validation, the Graph URL + body construction, and the outcome
 * mapping. Meta reports settled requests under endpoint-specific keys
 * (`approved_join_requests` / `rejected_join_requests`) and failures under
 * `failed_join_requests` (each with per-request error codes/messages).
 */

import {
  buildAuthHeaders,
  buildGraphUrl,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import type { GraphApiRequestContext, GraphApiRequestInit, JoinRequestsOutcome } from "@/backend/types";

/** One failed approve/reject join-requests entry reported by Meta. */
export interface GroupJoinRequestFailure {
  join_request_id: string;
  errors?: { code?: number; message?: string }[];
}

/**
 * Validates the join-request inputs before interpolation.
 *
 * These are internal developer-facing validation errors caught by the adapter
 * and wrapped into structured error codes.
 */
function validateGroupJoinRequestsInput(input: { groupId: string; joinRequestIds: string[] }): void {
  if (!input.groupId || input.groupId.length > 128) {
    throw new Error("Invalid groupId: must be non-empty and ≤128 chars");
  }
  if (!Array.isArray(input.joinRequestIds) || input.joinRequestIds.length === 0) {
    throw new Error("Invalid joinRequestIds: must be a non-empty array");
  }
  if (input.joinRequestIds.some(id => !id || id.length === 0)) {
    throw new Error("Invalid joinRequestIds: every entry must be a non-empty string");
  }
}

/**
 * Builds the fetch request for the `/{group_id}/join_requests` endpoint with
 * the given HTTP method (`POST` to approve, `DELETE` to reject — the reject
 * endpoint requires a JSON body on DELETE). The adapter adds
 * `AbortSignal.timeout(10_000)` before executing the `fetch`.
 */
export function buildGroupJoinRequestsRequestInit(
  ctx: GraphApiRequestContext,
  input: { groupId: string; joinRequestIds: string[] },
  method: "POST" | "DELETE"
): GraphApiRequestInit {
  validateGroupJoinRequestsInput(input);

  const url = buildGraphUrl(`/${input.groupId}/join_requests`, ctx.apiVersion);

  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
    join_requests: input.joinRequestIds,
  };

  return {
    url,
    init: {
      method,
      headers: buildAuthHeaders(ctx.accessToken, true),
      body: JSON.stringify(body),
    },
  };
}

/**
 * Maps a successful (2xx or 206 partial-success) join-requests response body
 * to the aggregated outcome: the settled requests reported under the
 * endpoint-specific key (`approved` when present, otherwise an empty array)
 * and failures under `failed_join_requests`. A 206 means only part of the
 * batch settled — the body is handled regardless of status.
 */
export function parseGroupJoinRequestsOutcome(
  approved: string[] | undefined,
  failed: GroupJoinRequestFailure[] | undefined
): JoinRequestsOutcome {
  return {
    approved: approved ?? [],
    failed: (failed ?? []).map(failure => ({
      joinRequestId: failure.join_request_id,
      errors: (failure.errors ?? []).map(error => ({
        code: error.code,
        message: error.message,
      })),
    })),
  };
}
