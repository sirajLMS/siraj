/**
 * Graph API request builder: GET /{waba_id}/phone_numbers
 *
 * Lists all phone numbers attached to a WhatsApp Business Account (WABA),
 * following cursor pagination (`paging.cursors.next`) until exhausted (P2).
 *
 * Each phone number carries `displayPhoneNumber`, `qualityRating`, `throughputLevel`,
 * `verifiedName`, and is further enriched with `portfolioMessagingLimitTier`
 * via the separate `get-phone-number.request.ts` builder (Q5).
 */

import { buildPaginatedListRequest } from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/build-paginated-list-request";
import type {
  GraphApiRequestContext,
  GraphApiRequestInit,
  ListPhoneNumbersInput,
  ListPhoneNumbersResponseBody,
  WhatsappPhoneNumber,
} from "@/backend/types/whatsapp/whatsapp-cloud-api.types";

/** Re-exported from the types layer for backward compatibility. */
export type { ListPhoneNumbersResponseBody } from "@/backend/types/whatsapp/whatsapp-cloud-api.types";

const { buildRequest: factoryBuildRequest, collectAll } = buildPaginatedListRequest<
  WhatsappPhoneNumber,
  ListPhoneNumbersResponseBody
>({
  path: "phone_numbers",
});

/**
 * Builds a single-page fetch request for GET /{waba_id}/phone_numbers.
 * Pagination loop is handled by `collectAllPhoneNumbers` via `collectAllPages`.
 *
 * @param ctx Request context (access token, API version).
 * @param input WABA ID to list phone numbers for.
 * @param afterCursor Optional cursor from a prior page's `paging.cursors.after`.
 */
export function buildRequest(
  ctx: GraphApiRequestContext,
  input: ListPhoneNumbersInput,
  afterCursor?: string
): GraphApiRequestInit {
  return factoryBuildRequest(ctx, input.wabaId, afterCursor);
}

/**
 * Parses a page of the list-phone-numbers response.
 * Returns the phone numbers and the `after` cursor for the next page.
 * The adapter follows cursors until `paging.next` is absent (P2).
 */
export function parseResponse(body: ListPhoneNumbersResponseBody): {
  phoneNumbers: readonly WhatsappPhoneNumber[];
  nextCursor: string | undefined;
} {
  return {
    phoneNumbers: body.data ?? [],
    nextCursor: body.paging?.cursors?.after,
  };
}

/**
 * Collects all phone numbers across all cursor pages, following
 * `paging.cursors.after` until it is absent (P2 constraint).
 *
 * The adapter (Task 5) supplies a `fetchPage` function that actually
 * executes the `fetch` — this keeps the builder pure and testable.
 *
 * @param ctx Request context.
 * @param input WABA ID.
 * @param fetchPage Callback that executes a fetch for a given `RequestInit` and returns the JSON body.
 * @returns Aggregated phone numbers across all pages.
 */
export async function collectAllPhoneNumbers(
  ctx: GraphApiRequestContext,
  input: ListPhoneNumbersInput,
  fetchPage: (request: GraphApiRequestInit) => Promise<ListPhoneNumbersResponseBody>
): Promise<readonly WhatsappPhoneNumber[]> {
  return collectAll(ctx, input.wabaId, fetchPage);
}
