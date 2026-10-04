"use client";

import { useMemo } from "react";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import {
  STATUS_ROW_SX,
  statusRowClassName,
} from "@/frontend/common/views/dashboard/classes/status/tracking/components/__shared__/statusTrackingGridShared";
import type {
  StatusTrackingDataGridProps,
  StatusTrackingScheduleRow,
} from "@/frontend/common/views/dashboard/classes/status/tracking/types";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui";
import { buildStatusTrackingDataGridDesktopColumns } from "@/frontend/desktop/views/dashboard/classes/status/tracking/statusTrackingDataGridDesktop.columns";

export function StatusTrackingDataGridDesktop({
  rows,
  labels,
  onActivate,
  onReschedule,
  onVerify,
  loading = false,
}: StatusTrackingDataGridProps) {
  const locale = useAppLocale();

  // RENDER OPT JUSTIFICATION: cache `useMemo` to maintain stable column array identity for the MUI AppDataGrid consumer (prevents column re-allocation across renders when labels/locale props are unchanged)
  const columns = useMemo(
    () => buildStatusTrackingDataGridDesktopColumns({ labels, locale, onActivate, onReschedule, onVerify }),
    [labels, locale, onActivate, onReschedule, onVerify]
  );

  return (
    <DesktopAppDataGrid<StatusTrackingScheduleRow>
      rows={rows}
      columns={columns}
      loading={loading}
      getRowId={row => row.id ?? ""}
      autoHeight
      rowHeight={100}
      ariaLabel="status-tracking-table"
      emptyMessage={labels.noEntries}
      paginationOptions={{ mode: "client" }}
      getRowClassName={({ row }) => statusRowClassName(row)}
      sx={STATUS_ROW_SX}
    />
  );
}
