/**
 * Graph API request builder: GET /{phone_number_id}/groups
 *
 * Lists the WhatsApp groups scoped to a Cloud API phone number, following
 * cursor pagination (`paging.cursors.after`) until exhausted. `limit` is
 * bounded at 1–1024 and `after`/`before` cursors come from a prior page's
 * `paging.cursors`.
 */

import {
  buildAuthHeaders,
  buildGraphUrl,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import type { GraphApiRequestContext, GraphApiRequestInit, ListGroupsRaw } from "@/backend/types";

/**
 * Builds the fetch request for GET /{phone_number_id}/groups.
 * The adapter adds `AbortSignal.timeout(10_000)` before executing.
 */
export function buildListGroupsRequest(
  ctx: GraphApiRequestContext,
  input: { phoneNumberId: string; limit?: number; after?: string; before?: string }
): GraphApiRequestInit {
  // Validate inputs before interpolation
  // These are internal developer-facing validation errors caught by the adapter and wrapped into structured error codes
  if (!input.phoneNumberId || input.phoneNumberId.length > 64 || !/^\d+$/.test(input.phoneNumberId)) {
    throw new Error("Invalid phoneNumberId: must be a non-empty numeric string ≤64 chars");
  }
  if (input.limit !== undefined && (input.limit < 1 || input.limit > 1024)) {
    throw new Error("Invalid limit: must be between 1 and 1024");
  }
  if (input.after !== undefined && (!input.after || input.after.length > 256)) {
    throw new Error("Invalid after cursor: must be non-empty and ≤256 chars");
  }
  if (input.before !== undefined && (!input.before || input.before.length > 256)) {
    throw new Error("Invalid before cursor: must be non-empty and ≤256 chars");
  }

  // Build query string from present params only (e.g. `?limit=25&after=x`)
  const queryParams: string[] = [];
  if (input.limit !== undefined) {
    queryParams.push(`limit=${input.limit}`);
  }
  if (input.after !== undefined) {
    queryParams.push(`after=${encodeURIComponent(input.after)}`);
  }
  if (input.before !== undefined) {
    queryParams.push(`before=${encodeURIComponent(input.before)}`);
  }
  const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : undefined;

  const url = buildGraphUrl(`/${input.phoneNumberId}/groups`, ctx.apiVersion, queryString);

  return {
    url,
    init: {
      method: "GET",
      headers: buildAuthHeaders(ctx.accessToken),
    },
  };
}

/**
 * Parses a page of the list-groups response.
 * Returns the groups (with `created_at` unix seconds mapped to `createdAt`)
 * and the `after`/`before` cursors for pagination.
 * The adapter follows cursors until `paging.next` is absent.
 */
export function parseListGroupsResponse(body: ListGroupsRaw): {
  groups: { groupId: string; subject: string; createdAt?: Date }[];
  nextCursor?: string;
  previousCursor?: string;
} {
  return {
    groups:
      body.data?.groups?.map(group => ({
        groupId: group.id,
        subject: group.subject,
        ...(group.created_at !== undefined ? { createdAt: new Date(Number(group.created_at) * 1000) } : {}),
      })) ?? [],
    nextCursor: body.paging?.cursors?.after,
    previousCursor: body.paging?.cursors?.before,
  };
}
