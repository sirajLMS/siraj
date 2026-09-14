"use client";

import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import type { GeneralSettingsViewModel } from "@/frontend/common/views/dashboard/settings/types/generalSettings.types";
import { buildGeneralSettingsColumns } from "@/frontend/common/views/dashboard/settings/utils/generalSettingsColumns";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container/DesktopSectionPanel";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid";

export function GeneralSettingsTabDesktopView({
  rows,
  loading,
  canManage,
  labels,
  savingCode,
  onValueChange,
}: Readonly<GeneralSettingsViewModel>) {
  const columns = useMemo<GridColDef[]>(
    () => buildGeneralSettingsColumns(labels, { onValueChange, savingCode }, canManage),
    [labels, onValueChange, savingCode, canManage]
  );

  return (
    <DesktopSectionPanel title={labels.title} subTitle={labels.subtitle} contentPadding={false}>
      <DesktopAppDataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        emptyMessage={labels.empty}
        getRowId={row => row.code}
        autoHeight
        paginationOptions={{ mode: "client" }}
        sx={{
          // Enable horizontal scroll so the DESCRIPTION column (which has long
          // text) is fully accessible instead of being clipped at the right edge.
          "& .MuiDataGrid-virtualScroller": { overflowX: "auto" },
        }}
      />
    </DesktopSectionPanel>
  );
}
