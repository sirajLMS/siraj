"use client";

import { useEffect, useMemo } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useSettingsTimezonesQuery } from "@/frontend/common/hooks/settings";
import {
  SETTINGS_TIMEZONES_PAGE_SIZE,
  useSettingsTimezonesStore,
} from "@/frontend/common/stores/settingsTimezonesStore";
import type { SettingsTimezonesViewModel } from "@/frontend/common/views/dashboard/settings/types/settingsTimezones.types";
import {
  buildSettingsTimezoneColumns,
  mapSettingsTimezoneRows,
  matchesSearchQuery,
} from "@/frontend/common/views/dashboard/settings/utils/settingsTimezones.utils";
import { useAppTranslation } from "@/shared/locale";

function useSettingsTimezonesSearchState() {
  const searchQuery = useSettingsTimezonesStore(state => state.searchQuery);
  const debouncedSearch = useSettingsTimezonesStore(state => state.debouncedSearch);
  const setSearchQuery = useSettingsTimezonesStore(state => state.setSearchQuery);
  const setDebouncedSearch = useSettingsTimezonesStore(state => state.setDebouncedSearch);

  const debouncedApplySearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value);
  }, 300);

  useEffect(() => {
    debouncedApplySearch(searchQuery);
  }, [debouncedApplySearch, searchQuery]);

  const isSearchActive = debouncedSearch.trim().length > 0;
  const isSearchPending = searchQuery.trim() !== debouncedSearch.trim();

  return {
    searchQuery,
    debouncedSearch,
    isSearchActive,
    isSearchPending,
    onSearchChange: setSearchQuery,
  };
}

export function useSettingsTimezonesViewModel(): SettingsTimezonesViewModel {
  const labels = useAppTranslation().dashboardTranslations.settings.timezones;
  const page = useSettingsTimezonesStore(state => state.page);
  const setPage = useSettingsTimezonesStore(state => state.setPage);
  const { searchQuery, debouncedSearch, isSearchActive, isSearchPending, onSearchChange } =
    useSettingsTimezonesSearchState();

  const { data, loading } = useSettingsTimezonesQuery(isSearchActive);

  const sourceRows = useMemo(
    () => mapSettingsTimezoneRows(data?.settingsTimezones?.rows ?? [], labels),
    [data?.settingsTimezones?.rows, labels]
  );

  const rows = useMemo(() => {
    if (!isSearchActive) {
      return sourceRows;
    }

    return sourceRows.filter(row => matchesSearchQuery(row, debouncedSearch));
  }, [debouncedSearch, isSearchActive, sourceRows]);

  const columns = useMemo(() => buildSettingsTimezoneColumns(labels), [labels]);
  const totalCount = isSearchActive ? rows.length : (data?.settingsTimezones?.totalCount ?? 0);

  return {
    labels,
    rows,
    columns,
    page,
    pageSize: SETTINGS_TIMEZONES_PAGE_SIZE,
    totalCount,
    loading,
    searchQuery,
    isSearchPending,
    paginationMode: isSearchActive ? "client" : "server",
    onSearchChange,
    onPageChange: setPage,
  };
}
