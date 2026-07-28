"use client";

import { AppDataGrid } from "@/frontend/common/components/ui";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type {
  SettingsAuditDataGridProps,
  SettingsAuditRow,
} from "@/frontend/common/views/dashboard/settings/types/settingsAudit.types";

export function SettingsAuditDataGrid({
  rows,
  columns,
  page,
  pageSize,
  totalCount,
  loading,
  emptyMessage,
  onPageChange,
}: Readonly<SettingsAuditDataGridProps>) {
  return (
    <AppDataGrid<SettingsAuditRow>
      rows={rows}
      columns={columns}
      loading={loading}
      getRowId={row => row.id}
      emptyMessage={emptyMessage}
      ariaLabel="settings-audit-logs"
      paginationOptions={buildServerPaginationOptions({
        page,
        pageSize,
        totalCount,
        onPageChange,
        pageSizeOptions: [pageSize],
      })}
    />
  );
}
