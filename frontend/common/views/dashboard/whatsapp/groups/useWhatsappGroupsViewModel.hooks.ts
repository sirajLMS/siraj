"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getDateTimeFormatter } from "@/frontend/common/components/intl/dateFormat";
import type { WhatsappGroupRow } from "@/frontend/common/views/dashboard/whatsapp/groups/types/whatsappGroupsView.types";
import {
  PAGE_SIZE,
  TIMESTAMP_OPTIONS,
} from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.constants";
import {
  buildAccountOptions,
  isGroupRow,
} from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.helpers";
import type { WorkspaceQueries } from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.queries.hooks";
import type { AppLocale } from "@/shared/locale/AppLocale";

export {
  useWorkspaceQueries,
  type WorkspaceQueries,
} from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.queries.hooks";

export function useWorkspaceFilters() {
  const [accountId, setAccountIdState] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const onAccountChange = useCallback((nextAccountId: string) => {
    setAccountIdState(nextAccountId);
    setSearch("");
    setPage(0);
    setSelectedGroupId(null);
  }, []);
  const onSearchChange = useCallback((value: string) => setSearch(value), []);
  const onSelectGroup = useCallback((groupId: string) => setSelectedGroupId(groupId), []);
  const onCloseGroup = useCallback(() => setSelectedGroupId(null), []);

  return {
    accountId,
    setAccountId: setAccountIdState,
    search,
    page,
    setPage,
    selectedGroupId,
    onSelectGroup,
    onCloseGroup,
    onAccountChange,
    onSearchChange,
  };
}

export type WorkspaceFilters = ReturnType<typeof useWorkspaceFilters>;

/**
 * Keeps the list page anchored to the server-reported total: records each
 * payload's totalCount and re-anchors the page filter to the last existing
 * page when the total shrinks below it.
 */
export function useSyncListPage(
  data: WorkspaceQueries["groupsQuery"]["data"],
  requestedPage: number,
  setPage: (page: number) => void,
  noteTotalCount: (totalCount: number) => void
) {
  useEffect(() => {
    const totalCount = data?.whatsappGroups?.totalCount;
    if (totalCount === undefined) {
      return;
    }
    noteTotalCount(totalCount);
    const lastPage = Math.max(0, Math.ceil(totalCount / PAGE_SIZE) - 1);
    if (requestedPage > lastPage) {
      setPage(lastPage);
    }
  }, [data, requestedPage, setPage, noteTotalCount]);
}

export function useNoticeState() {
  const [notice, setNotice] = useState<{ text: string; severity: "success" | "error" } | null>(null);
  const dismissNotice = useCallback(() => setNotice(null), []);
  const showNotice = useCallback((text: string, severity: "success" | "error") => {
    setNotice({ text, severity });
  }, []);
  return { notice, showNotice, dismissNotice };
}

export type NoticeState = ReturnType<typeof useNoticeState>;

/** Resolves the selected group from the detail query, falling back to the list row. */
export function useSelectedGroup(
  groupsQuery: WorkspaceQueries["groupsQuery"],
  groupQuery: WorkspaceQueries["groupQuery"],
  selectedGroupId: string | null
) {
  const selectedGroupFromList = useMemo(() => {
    const pageRows = (groupsQuery.data?.whatsappGroups?.rows ?? []).filter(isGroupRow);
    return pageRows.find(row => row.id === selectedGroupId) ?? null;
  }, [groupsQuery.data, selectedGroupId]);
  return useMemo<WhatsappGroupRow | null>(() => {
    const detail = groupQuery.data?.whatsappGroup ?? null;
    if (detail !== null) {
      return detail;
    }
    return selectedGroupFromList;
  }, [groupQuery.data, selectedGroupFromList]);
}

export function useAccounts(
  accountsQuery: WorkspaceQueries["accountsQuery"],
  locale: AppLocale,
  accountId: string | null,
  selectAccount: (id: string) => void
) {
  const accounts = useMemo(
    () => buildAccountOptions(accountsQuery.data?.whatsappAccounts ?? null, locale),
    [accountsQuery.data, locale]
  );

  // Default to the first connected number once accounts resolve; re-anchor if
  // the selected number disappears from the list (sync/deactivation).
  useEffect(() => {
    const first = accounts[0];
    if (first && (accountId === null || !accounts.some(option => option.id === accountId))) {
      selectAccount(first.id);
    }
  }, [accounts, accountId, selectAccount]);

  const accountLabel = useCallback(
    (id: string | null) => accounts.find(option => option.id === id)?.label ?? null,
    [accounts]
  );

  return { accounts, accountsLoading: accountsQuery.loading, accountLabel };
}

export function useFormatTimestamp(locale: AppLocale) {
  return useCallback(
    (iso: string | null) => {
      if (!iso) {
        return "";
      }
      const localeTag = locale === "ar" ? "ar" : "en";
      return getDateTimeFormatter(localeTag, TIMESTAMP_OPTIONS).format(new Date(iso));
    },
    [locale]
  );
}
