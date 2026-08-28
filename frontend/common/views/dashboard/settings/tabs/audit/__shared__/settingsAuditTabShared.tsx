"use client";

import type { ReactNode } from "react";
import { SettingsAuditDataGrid } from "@/frontend/common/views/dashboard/settings/components/audit/SettingsAuditDataGrid";
import { SettingsAuditFilterBar } from "@/frontend/common/views/dashboard/settings/components/audit/SettingsAuditFilterBar";
import {
  SettingsTabShared,
  type SettingsTabSharedOptions,
} from "@/frontend/common/views/dashboard/settings/tabs/__shared__/settingsTabShared";
import type { SettingsAuditViewModel } from "@/frontend/common/views/dashboard/settings/types/settingsAuditViewModel.types";

export interface SettingsAuditTabSharedProps {
  readonly viewModel: SettingsAuditViewModel;
  readonly options: SettingsTabSharedOptions;
  /**
   * Tier-supplied list body. When omitted, the shared desktop DataGrid is used;
   * the mobile tier supplies a card-list body instead.
   */
  readonly listBody?: ReactNode;
}

export function SettingsAuditTabShared({ viewModel, options, listBody }: Readonly<SettingsAuditTabSharedProps>) {
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
        listBody ?? (
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
        )
      }
    />
  );
}
