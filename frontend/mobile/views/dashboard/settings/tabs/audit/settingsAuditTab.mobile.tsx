"use client";

import { MOBILE_TAB_OPTIONS } from "@/frontend/common/views/dashboard/settings/tabs/__shared__/settingsTabShared.options";
import { SettingsAuditTabShared } from "@/frontend/common/views/dashboard/settings/tabs/audit/__shared__/settingsAuditTabShared";
import type { SettingsAuditViewModel } from "@/frontend/common/views/dashboard/settings/types/settingsAuditViewModel.types";
import { SettingsAuditCardListMobile } from "@/frontend/mobile/views/dashboard/settings/tabs/audit/settingsAuditCardList.mobile";

export function SettingsAuditTabMobileView(viewModel: Readonly<SettingsAuditViewModel>) {
  return (
    <SettingsAuditTabShared
      viewModel={viewModel}
      options={MOBILE_TAB_OPTIONS}
      listBody={
        <SettingsAuditCardListMobile
          rows={viewModel.rows}
          columnLabels={viewModel.labels.columns}
          emptyMessage={viewModel.labels.emptyMessage}
          loading={viewModel.loading}
          page={viewModel.page}
          pageSize={viewModel.pageSize}
          totalCount={viewModel.totalCount}
          onPageChange={viewModel.onPageChange}
        />
      }
    />
  );
}
