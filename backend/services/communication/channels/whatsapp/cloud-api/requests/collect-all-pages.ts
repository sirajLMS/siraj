/**
 * Generic cursor-pagination collector for Graph API list endpoints.
 *
 * Several list endpoints (message-templates, phone-numbers, …) share an
 * identical do/while loop that builds a request for the current cursor,
 * fetches the page, parses the items + next cursor, and accumulates items.
 *
 * `collectAllPages<T>` centralises that loop so each endpoint only needs to
 * supply its type-specific `buildRequest` and `parseResponse` functions.
 *
 * The helper follows `paging.cursors.after` until it is `undefined` (P2) and
 * includes a `maxPages` safety guard to prevent runaway loops.
 */

import { logger } from "@/backend/lib/logger";
import type { GraphApiRequestInit } from "@/backend/types";

/**
 * Parsed page result: the items on this page and the cursor for the next page
 * (or `undefined` when the final page has been reached).
 */
export interface ParsedPage<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | undefined;
}

/**
 * Generic collector that aggregates all items across cursor-paginated pages.
 *
 * @template T           Item type accumulated across pages.
 * @template R           Raw response body type returned by `fetchPage` and consumed by `parseResponse`.
 * @param buildRequest    Builds a `GraphApiRequestInit` for a given cursor (or `undefined` for the first page).
 * @param fetchPage       Executes the fetch and returns the raw JSON body.
 * @param parseResponse   Extracts the items array and next cursor from a raw page body.
 * @param maxPages        Safety limit on the number of pages fetched (default 50).
 * @returns All items collected across every page, in page order.
 */
export async function collectAllPages<T, R = unknown>(
  buildRequest: (cursor: string | undefined) => GraphApiRequestInit,
  fetchPage: (request: GraphApiRequestInit) => Promise<R>,
  parseResponse: (body: R) => ParsedPage<T>,
  maxPages = 50
): Promise<readonly T[]> {
  const allItems: T[] = [];

  async function fetchNext(cursor: string | undefined, pageCount: number): Promise<void> {
    if (pageCount >= maxPages) {
      logger.warn("collectAllPages: reached maxPages limit, results may be truncated", {
        maxPages,
        itemsCollected: allItems.length,
      });
      return;
    }
    const request = buildRequest(cursor);
    const body = await fetchPage(request);
    const { items, nextCursor } = parseResponse(body);
    allItems.push(...items);
    if (!nextCursor) return;
    return fetchNext(nextCursor, pageCount + 1);
  }

  await fetchNext(undefined, 0);

  return allItems;
}
