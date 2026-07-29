"use client";

import { Stack } from "@mui/material";
import { SettingsTimezonesDataGrid } from "@/frontend/common/views/dashboard/settings/components/timezones/SettingsTimezonesDataGrid";
import { SettingsTimezonesSearchBar } from "@/frontend/common/views/dashboard/settings/components/timezones/SettingsTimezonesSearchBar";
import type { SettingsTimezonesViewModel } from "@/frontend/common/views/dashboard/settings/types/settingsTimezones.types";

export function SettingsTimezonesTabMobileView(viewModel: Readonly<SettingsTimezonesViewModel>) {
  return (
    <Stack sx={{ gap: 2 }}>
      <SettingsTimezonesSearchBar
        value={viewModel.searchQuery}
        placeholder={viewModel.labels.searchPlaceholder}
        searchingLabel={viewModel.labels.searchingLabel}
        isSearching={viewModel.isSearchPending}
        onChange={viewModel.onSearchChange}
      />

      <SettingsTimezonesDataGrid
        rows={viewModel.rows}
        columns={viewModel.columns}
        loading={viewModel.loading}
        emptyMessage={viewModel.labels.emptyMessage}
        paginationMode={viewModel.paginationMode}
        page={viewModel.page}
        pageSize={viewModel.pageSize}
        totalCount={viewModel.totalCount}
        onPageChange={viewModel.onPageChange}
      />
    </Stack>
  );
}
