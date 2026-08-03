/**
 * Graph API request builder: GET /{waba_id}/message_templates
 *
 * Lists all message templates (approved/pending/rejected) for a WABA,
 * following cursor pagination until exhausted (P2).
 *
 * The response MUST carry each template's exact `language.code` (e.g. `ar`,
 * `en_US`, `ar_AR`) for send-time resolution (B6). Never map or transform
 * the language code locally.
 */

import { buildPaginatedListRequest } from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/build-paginated-list-request";
import type {
  GraphApiRequestContext,
  GraphApiRequestInit,
  ListMessageTemplatesInput,
  ListMessageTemplatesResponseBody,
  WhatsappMessageTemplate,
} from "@/backend/types/whatsapp/whatsapp-cloud-api.types";

/** Re-exported from the types layer for backward compatibility. */
export type { ListMessageTemplatesResponseBody } from "@/backend/types/whatsapp/whatsapp-cloud-api.types";

const { buildRequest: factoryBuildRequest, collectAll } = buildPaginatedListRequest<
  WhatsappMessageTemplate,
  ListMessageTemplatesResponseBody
>({
  path: "message_templates",
});

/**
 * Builds a single-page fetch request for GET /{waba_id}/message_templates.
 * Pagination loop is handled by `collectAllTemplates` via `collectAllPages`.
 *
 * @param ctx Request context (access token, API version).
 * @param input WABA ID to list templates for.
 * @param afterCursor Optional cursor from a prior page's `paging.cursors.after`.
 */
export function buildRequest(
  ctx: GraphApiRequestContext,
  input: ListMessageTemplatesInput,
  afterCursor?: string
): GraphApiRequestInit {
  return factoryBuildRequest(ctx, input.wabaId, afterCursor);
}

/**
 * Parses a page of the list-message-templates response.
 * Returns the templates and the `after` cursor for the next page.
 * The adapter follows cursors until `paging.next` is absent (P2).
 *
 * Each template's `language.code` is preserved exactly from Meta's payload (B6).
 */
export function parseResponse(body: ListMessageTemplatesResponseBody): {
  templates: readonly WhatsappMessageTemplate[];
  nextCursor: string | undefined;
} {
  return {
    templates: body.data ?? [],
    nextCursor: body.paging?.cursors?.after,
  };
}

/**
 * Collects all message templates across all cursor pages, following
 * `paging.cursors.after` until it is absent (P2 constraint).
 *
 * The adapter (Task 5) supplies a `fetchPage` function that actually
 * executes the `fetch` — this keeps the builder pure and testable.
 *
 * @param ctx Request context.
 * @param input WABA ID.
 * @param fetchPage Callback that executes a fetch for a given `RequestInit` and returns the JSON body.
 * @returns Aggregated templates across all pages, with exact `language.code` (B6).
 */
export async function collectAllTemplates(
  ctx: GraphApiRequestContext,
  input: ListMessageTemplatesInput,
  fetchPage: (request: GraphApiRequestInit) => Promise<ListMessageTemplatesResponseBody>
): Promise<readonly WhatsappMessageTemplate[]> {
  return collectAll(ctx, input.wabaId, fetchPage);
}
