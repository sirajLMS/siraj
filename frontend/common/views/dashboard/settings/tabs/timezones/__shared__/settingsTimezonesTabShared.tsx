"use client";

import type { ReactNode } from "react";
import { SettingsTimezonesDataGrid } from "@/frontend/common/views/dashboard/settings/components/timezones/SettingsTimezonesDataGrid";
import { SettingsTimezonesSearchBar } from "@/frontend/common/views/dashboard/settings/components/timezones/SettingsTimezonesSearchBar";
import {
  SettingsTabShared,
  type SettingsTabSharedOptions,
} from "@/frontend/common/views/dashboard/settings/tabs/__shared__/settingsTabShared";
import type { SettingsTimezonesViewModel } from "@/frontend/common/views/dashboard/settings/types/settingsTimezones.types";

export interface SettingsTimezonesTabSharedProps {
  readonly viewModel: SettingsTimezonesViewModel;
  readonly options: SettingsTabSharedOptions;
  /**
   * Tier-supplied list body. When omitted, the shared desktop DataGrid is used;
   * the mobile tier supplies a card-list body instead.
   */
  readonly listBody?: ReactNode;
}

export function SettingsTimezonesTabShared({
  viewModel,
  options,
  listBody,
}: Readonly<SettingsTimezonesTabSharedProps>) {
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
        listBody ?? (
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
        )
      }
    />
  );
}
