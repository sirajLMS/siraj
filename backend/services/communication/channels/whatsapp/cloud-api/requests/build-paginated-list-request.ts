/**
 * Generic factory for Graph API cursor-paginated list endpoints.
 *
 * Several list endpoints (`/{waba_id}/phone_numbers`,
 * `/{waba_id}/message_templates`, …) share an identical `buildRequest` →
 * `collectAllPages` pattern.  The only differences are the API path segment,
 * the item type, and the response body type.
 *
 * `buildPaginatedListRequest` produces a ready-made `buildRequest` and
 * `collectAll` pair, so each endpoint file needs only to supply its
 * path, types, and (optionally) a custom page size.
 */

import {
  buildAuthHeaders,
  buildGraphUrl,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import {
  collectAllPages,
  type ParsedPage,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/collect-all-pages";
import type {
  GraphApiPaginatedResponse,
  GraphApiRequestContext,
  GraphApiRequestInit,
} from "@/backend/types";

/**
 * Options for {@link buildPaginatedListRequest}.
 *
 * @template T Item type accumulated across pages (e.g. `WhatsappPhoneNumber`).
 * @template R Raw response body type returned by `fetchPage`.
 */
export interface PaginatedListRequestOptions<T, _R extends GraphApiPaginatedResponse<T>> {
  /** API path segment appended after `/{wabaId}`, e.g. `"phone_numbers"`. */
  readonly path: string;
  /** Page size used for the first page request (default `100`). */
  readonly limit?: number;
}

/**
 * Return value of {@link buildPaginatedListRequest} — the generated
 * `buildRequest` and `collectAll` functions for a specific endpoint.
 */
export interface PaginatedListRequestResult<T, R extends GraphApiPaginatedResponse<T>> {
  /** Builds a single-page fetch request for `GET /{waba_id}/{path}`. */
  readonly buildRequest: (ctx: GraphApiRequestContext, wabaId: string, afterCursor?: string) => GraphApiRequestInit;
  /** Collects all items across all cursor pages. */
  readonly collectAll: (
    ctx: GraphApiRequestContext,
    wabaId: string,
    fetchPage: (request: GraphApiRequestInit) => Promise<R>
  ) => Promise<readonly T[]>;
}

/**
 * Creates a `buildRequest` + `collectAll` pair for a cursor-paginated
 * Graph API list endpoint.
 *
 * The generated `buildRequest` follows the standard pattern:
 *  - First page: `?limit=<limit>`
 *  - Subsequent pages: `?after=<encoded_cursor>`
 *
 * The generated `collectAll` wraps `collectAllPages`, extracting
 * `body.data` as items and `body.paging?.cursors?.after` as the next cursor.
 *
 * @template T Item type accumulated across pages.
 * @template R Raw paginated response body type.
 */
export function buildPaginatedListRequest<T, R extends GraphApiPaginatedResponse<T>>(
  options: PaginatedListRequestOptions<T, R>
): PaginatedListRequestResult<T, R> {
  const { path, limit = 100 } = options;

  function buildRequest(ctx: GraphApiRequestContext, wabaId: string, afterCursor?: string): GraphApiRequestInit {
    const queryString = afterCursor ? `after=${encodeURIComponent(afterCursor)}` : `limit=${limit}`;

    const url = buildGraphUrl(`/${wabaId}/${path}`, ctx.apiVersion, `?${queryString}`);

    return {
      url,
      init: {
        method: "GET",
        headers: buildAuthHeaders(ctx.accessToken),
      },
    };
  }

  async function collectAll(
    ctx: GraphApiRequestContext,
    wabaId: string,
    fetchPage: (request: GraphApiRequestInit) => Promise<R>
  ): Promise<readonly T[]> {
    return collectAllPages<T, R>(
      cursor => buildRequest(ctx, wabaId, cursor),
      fetchPage,
      (body: R): ParsedPage<T> => ({
        items: body.data ?? [],
        nextCursor: body.paging?.cursors?.after,
      })
    );
  }

  return { buildRequest, collectAll };
}
