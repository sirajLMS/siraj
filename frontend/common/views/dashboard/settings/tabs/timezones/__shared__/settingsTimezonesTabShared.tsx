"use client";

import { SettingsTimezonesDataGrid } from "@/frontend/common/views/dashboard/settings/components/timezones/SettingsTimezonesDataGrid";
import { SettingsTimezonesSearchBar } from "@/frontend/common/views/dashboard/settings/components/timezones/SettingsTimezonesSearchBar";
import {
  SettingsTabShared,
  type SettingsTabSharedOptions,
} from "@/frontend/common/views/dashboard/settings/tabs/__shared__/settingsTabShared";
import type { SettingsTimezonesViewModel } from "@/frontend/common/views/dashboard/settings/types/settingsTimezones.types";

export function SettingsTimezonesTabShared({
  viewModel,
  options,
}: Readonly<{ readonly viewModel: SettingsTimezonesViewModel; readonly options: SettingsTabSharedOptions }>) {
  return (
    <SettingsTabShared
      options={options}
      filterBar={
        <SettingsTimezonesSearchBar
          value={viewModel.searchQuery}
          placeholder={viewModel.labels.searchPlaceholder}
          searchingLabel={viewModel.labels.searchingLabel}
          isSearching={viewModel.isSearchPending}
          onChange={viewModel.onSearchChange}
        />
      }
      dataGrid={
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
      }
    />
  );
}
