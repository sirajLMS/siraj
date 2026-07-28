"use client";

import { AddOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { SystemSettingDeleteDialog } from "@/frontend/common/views/dashboard/settings/tabs/general/components/SystemSettingDeleteDialog";
import { SystemSettingFormDialog } from "@/frontend/common/views/dashboard/settings/tabs/general/components/SystemSettingFormDialog";
import type { GeneralSettingsViewModel } from "@/frontend/common/views/dashboard/settings/types/generalSettings.types";
import { buildGeneralSettingsColumns } from "@/frontend/common/views/dashboard/settings/utils/generalSettingsColumns";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button/DesktopActionButtons";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container/DesktopSectionPanel";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid";
import { useAppLocale } from "@/shared/locale";

export function GeneralSettingsTabDesktopView({
  rows,
  loading,
  canManage,
  labels,
  formOpen,
  editRow,
  deleteRow,
  isDeleting,
  onAdd,
  onEdit,
  onDelete,
  onFormClose,
  onDeleteClose,
  onSaved,
  onConfirmDelete,
}: Readonly<GeneralSettingsViewModel>) {
  const locale = useAppLocale();

  const columns = useMemo<GridColDef[]>(
    () => buildGeneralSettingsColumns(labels, { onEdit, onDelete }, canManage, locale),
    [labels, onEdit, onDelete, canManage, locale]
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
        <Box>
          <Typography sx={{ typography: "titleLg", mb: 1 }}>{labels.title}</Typography>
          <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
            {labels.subtitle}
          </Typography>
        </Box>
        {canManage ? (
          <DesktopPrimaryPageAction onClick={onAdd} startIcon={<AddOutlined />}>
            {labels.addLabel}
          </DesktopPrimaryPageAction>
        ) : null}
      </Box>

      <DesktopSectionPanel contentPadding={false}>
        <DesktopAppDataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          emptyMessage={labels.empty}
          getRowId={row => row.id}
          autoHeight
          paginationOptions={{ mode: "client" }}
        />
      </DesktopSectionPanel>

      {canManage ? (
        <>
          <SystemSettingFormDialog
            open={formOpen}
            row={editRow}
            labels={labels}
            onClose={onFormClose}
            onSaved={onSaved}
          />
          <SystemSettingDeleteDialog
            open={deleteRow != null}
            row={deleteRow}
            labels={labels}
            isLoading={isDeleting}
            onClose={onDeleteClose}
            onConfirm={() => {
              void onConfirmDelete();
            }}
          />
        </>
      ) : null}
    </Box>
  );
}
