"use client";

import { SettingsAuditDataGrid } from "@/frontend/common/views/dashboard/settings/components/audit/SettingsAuditDataGrid";
import { SettingsAuditFilterBar } from "@/frontend/common/views/dashboard/settings/components/audit/SettingsAuditFilterBar";
import type { SettingsTabSharedOptions } from "@/frontend/common/views/dashboard/settings/tabs/__shared__/settingsTabShared";
import { SettingsTabShared } from "@/frontend/common/views/dashboard/settings/tabs/__shared__/settingsTabShared";
import type { SettingsAuditViewModel } from "@/frontend/common/views/dashboard/settings/types/settingsAuditViewModel.types";

export function SettingsAuditTabShared({
  viewModel,
  options,
}: Readonly<{ readonly viewModel: SettingsAuditViewModel; readonly options: SettingsTabSharedOptions }>) {
  return (
    <SettingsTabShared
      options={options}
      filterBar={
        <SettingsAuditFilterBar
          labels={viewModel.labels.filters}
          entityType={viewModel.entityType}
          action={viewModel.action}
          fromDate={viewModel.fromDate}
          toDate={viewModel.toDate}
          entityTypeOptions={viewModel.entityTypeOptions}
          actionOptions={viewModel.actionOptions}
          entityTypeLabels={viewModel.labels.entityTypes}
          actionLabels={viewModel.labels.actions}
          onEntityTypeChange={viewModel.onEntityTypeChange}
          onActionChange={viewModel.onActionChange}
          onDateRangeChange={viewModel.onDateRangeChange}
        />
      }
      dataGrid={
        <SettingsAuditDataGrid
          rows={viewModel.rows}
          columns={viewModel.columns}
          page={viewModel.page}
          pageSize={viewModel.pageSize}
          totalCount={viewModel.totalCount}
          loading={viewModel.loading}
          emptyMessage={viewModel.labels.emptyMessage}
          onPageChange={viewModel.onPageChange}
        />
      }
    />
  );
}
