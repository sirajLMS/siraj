import type { WhatsappAccountsQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  WhatsappConversationRow,
  WhatsappInboxAccountOption,
  WhatsappMessageRow,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappInboxView.types";
import {
  buildPaginationArgs as buildSharedPaginationArgs,
  resolveAccountLabel,
} from "@/frontend/common/views/dashboard/whatsapp/__shared__";

export const PAGE_SIZE = 20;
export const THREAD_PAGE_SIZE = 50;
export const POLL_INTERVAL_MS = 30_000;
export const WHATSAPP_TIMESTAMP_OPTIONS: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
};

export function buildPaginationArgs(page: number, pageSize: number) {
  return buildSharedPaginationArgs(page, pageSize);
}

/** Only active accounts with a server id are offered as inbox filters. */
export function buildAccountOptions(rows: WhatsappAccountsQuery["whatsappAccounts"], locale: string) {
  const options: WhatsappInboxAccountOption[] = [];
  for (const row of rows ?? []) {
    if (row.id && row.isActive) {
      options.push({ id: row.id, label: resolveAccountLabel(row, locale), syncStatus: row.syncStatus ?? null });
    }
  }
  return options;
}

export function isConversationRow(row: { id: string | null }): row is WhatsappConversationRow {
  return row.id !== null;
}

export function isMessageRow(row: { id: string | null }): row is WhatsappMessageRow {
  return row.id !== null;
}

/** Case-insensitive match over the conversation's display fields; empty search returns the rows unchanged. */
export function buildConversationSearchRows(rows: readonly WhatsappConversationRow[], search: string) {
  const needle = search.trim().toLowerCase();
  if (!needle) {
    return rows;
  }
  return rows.filter(row =>
    [row.displayName, row.username, row.waId, row.lastMessagePreview].some(field =>
      field ? field.toLowerCase().includes(needle) : false
    )
  );
}
