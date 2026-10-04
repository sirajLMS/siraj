import { CombinedGraphQLErrors } from "@apollo/client/errors";
import type {
  WhatsappAccountsQuery,
  WhatsappGroupJoinRequestsQuery,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { logger } from "@/frontend/common/utils/logger";
import {
  buildPaginationArgs as buildSharedPaginationArgs,
  withVar as buildSharedWithVar,
  resolveAccountLabel,
} from "@/frontend/common/views/dashboard/whatsapp/__shared__";
import type {
  WhatsappGroupJoinRequestRow,
  WhatsappGroupMessageRow,
  WhatsappGroupRow,
  WhatsappGroupsAccountOption,
} from "@/frontend/common/views/dashboard/whatsapp/groups/types/whatsappGroupsView.types";
import { PAGE_SIZE } from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.constants";

export function buildPaginationArgs(page: number, pageSize: number) {
  return buildSharedPaginationArgs(page, pageSize);
}

export function withVar(template: string, variable: string, value: string): string {
  return buildSharedWithVar(template, variable, value);
}

export function buildAccountOptions(rows: WhatsappAccountsQuery["whatsappAccounts"], locale: string) {
  const options: WhatsappGroupsAccountOption[] = [];
  for (const row of rows ?? []) {
    if (row.id) {
      options.push({
        id: row.id,
        label: resolveAccountLabel(row, locale),
        isActive: row.isActive ?? false,
      });
    }
  }
  return options;
}

export function isGroupRow(row: { id: string | null }): row is WhatsappGroupRow {
  return row.id !== null;
}

export function isMessageRow(row: { id: string | null }): row is WhatsappGroupMessageRow {
  return row.id !== null;
}

function isJoinRequestRow(row: { id: string | null }): row is WhatsappGroupJoinRequestRow {
  return row.id !== null;
}

/** Join-request rows with a non-null id after Apollo normalization. */
export function filterJoinRequestRows(
  data: WhatsappGroupJoinRequestsQuery | undefined
): readonly WhatsappGroupJoinRequestRow[] {
  return (data?.whatsappGroupJoinRequests ?? []).filter(isJoinRequestRow);
}

/**
 * Service-level domain errors reach the client with an already-localized
 * message on the GraphQL error; codes select the dedicated translated string
 * first, then the localized server message, then the generic fallback.
 */
function localizedMessage(error: unknown): string | null {
  if (!CombinedGraphQLErrors.is(error)) {
    return null;
  }
  const message = error.errors[0]?.message;
  return typeof message === "string" && message !== "" ? message : null;
}

export function mapError(error: unknown, fallback: string, logContext: string): string {
  const serverMessage = localizedMessage(error);
  if (serverMessage !== null) {
    return serverMessage;
  }
  logger.warn(logContext, { message: error instanceof Error ? error.message : String(error) });
  return fallback;
}

/**
 * Page folded into the list-query variables: clamped against the most recent
 * server-reported total so a shrinking totalCount never keeps the query on a
 * page that no longer exists. Unclamped until the first payload lands.
 */
export function resolveListQueryPage(requestedPage: number, serverTotalCount: number | null): number {
  if (serverTotalCount === null) {
    return requestedPage;
  }
  return Math.min(requestedPage, Math.max(0, Math.ceil(serverTotalCount / PAGE_SIZE) - 1));
}

/** Resolves the display text of a persisted group message body, `null` for media-only rows. */
export function resolveMessageText(content: unknown): string | null {
  if (typeof content === "string") {
    return content === "" ? null : content;
  }
  // Persisted rows carry the Meta typed-content envelope (e.g. `{ body, … }`).
  if (typeof content !== "object" || content === null || !("body" in content)) {
    return null;
  }
  const body: unknown = content.body;
  return typeof body === "string" && body !== "" ? body : null;
}
