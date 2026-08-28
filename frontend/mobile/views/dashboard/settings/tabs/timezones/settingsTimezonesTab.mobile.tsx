"use client";

import { MOBILE_TAB_OPTIONS } from "@/frontend/common/views/dashboard/settings/tabs/__shared__/settingsTabShared.options";
import { SettingsTimezonesTabShared } from "@/frontend/common/views/dashboard/settings/tabs/timezones/__shared__/settingsTimezonesTabShared";
import type { SettingsTimezonesViewModel } from "@/frontend/common/views/dashboard/settings/types/settingsTimezones.types";
import { SettingsTimezonesCardListMobile } from "@/frontend/mobile/views/dashboard/settings/tabs/timezones/settingsTimezonesCardList.mobile";

export function SettingsTimezonesTabMobileView(viewModel: Readonly<SettingsTimezonesViewModel>) {
  return (
    <SettingsTimezonesTabShared
      viewModel={viewModel}
      options={MOBILE_TAB_OPTIONS}
      listBody={
        <SettingsTimezonesCardListMobile
          rows={viewModel.rows}
          columnLabels={viewModel.labels.columns}
          emptyMessage={viewModel.labels.emptyMessage}
          loading={viewModel.loading}
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
