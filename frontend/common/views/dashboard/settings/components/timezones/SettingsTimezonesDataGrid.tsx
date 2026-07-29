"use client";

import { AppDataGrid } from "@/frontend/common/components/ui";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type {
  SettingsTimezoneRow,
  SettingsTimezonesDataGridProps,
} from "@/frontend/common/views/dashboard/settings/types/settingsTimezones.types";

export function SettingsTimezonesDataGrid({
  rows,
  columns,
  loading,
  emptyMessage,
  paginationMode,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: Readonly<SettingsTimezonesDataGridProps>) {
  const paginationOptions =
    paginationMode === "server"
      ? buildServerPaginationOptions({
          page,
          pageSize,
          totalCount,
          onPageChange,
          pageSizeOptions: [pageSize],
        })
      : { mode: "client" as const };

  return (
    <AppDataGrid<SettingsTimezoneRow>
      rows={rows}
      columns={columns}
      loading={loading}
      getRowId={row => row.id}
      emptyMessage={emptyMessage}
      ariaLabel="settings-timezones"
      paginationOptions={paginationOptions}
    />
  );
}
