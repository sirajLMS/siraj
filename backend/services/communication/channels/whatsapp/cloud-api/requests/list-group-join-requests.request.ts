/**
 * Graph API request builder: GET /{group_id}/join_requests
 *
 * Lists pending join requests for a WhatsApp group, following cursor
 * pagination via `after`/`before` cursors.
 */

import { buildGraphUrl } from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import type { GraphApiRequestContext, GraphApiRequestInit, GroupJoinRequestsListRaw } from "@/backend/types";

/**
 * Builds the fetch request for GET /{group_id}/join_requests.
 * The adapter adds `AbortSignal.timeout(10_000)` before executing the `fetch`.
 */
export function buildListGroupJoinRequestsRequest(
  ctx: GraphApiRequestContext,
  input: { groupId: string; after?: string; before?: string }
): GraphApiRequestInit {
  // Validate inputs before interpolation
  // These are internal developer-facing validation errors caught by the adapter and wrapped into structured error codes
  if (!input.groupId || input.groupId.length > 128) {
    throw new Error("Invalid groupId: must be non-empty and ≤128 chars");
  }
  if (input.after?.length === 0) {
    throw new Error("Invalid after cursor: must be non-empty when present");
  }
  if (input.before?.length === 0) {
    throw new Error("Invalid before cursor: must be non-empty when present");
  }

  const params = new URLSearchParams();
  if (input.after !== undefined) {
    params.set("after", input.after);
  }
  if (input.before !== undefined) {
    params.set("before", input.before);
  }
  const queryString = params.toString();

  const url = buildGraphUrl(`/${input.groupId}/join_requests`, ctx.apiVersion, queryString);

  return { url, init: { method: "GET" } };
}

/**
 * Parses a page of the list-group-join-requests response.
 * Maps Meta's snake_case wire fields to camelCase; `creation_timestamp`
 * (unix seconds) is converted to a `Date`, and `paging.cursors.after`
 * becomes the `nextCursor` for the following page.
 */
export function parseListGroupJoinRequestsResponse(body: GroupJoinRequestsListRaw): {
  requests: {
    joinRequestId: string;
    waId: string;
    creationTimestamp: Date;
  }[];
  nextCursor?: string;
} {
  return {
    requests: (body.data ?? []).map(request => ({
      joinRequestId: request.join_request_id,
      waId: request.wa_id,
      creationTimestamp: new Date(Number(request.creation_timestamp) * 1000),
    })),
    nextCursor: body.paging?.cursors?.after,
  };
}
