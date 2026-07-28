"use client";

import { AddOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { SiteContentEntryDeleteDialog } from "@/frontend/common/views/dashboard/settings/tabs/siteContent/components/SiteContentEntryDeleteDialog";
import { SiteContentEntryFormDialog } from "@/frontend/common/views/dashboard/settings/tabs/siteContent/components/SiteContentEntryFormDialog";
import type { SiteContentSettingsViewModel } from "@/frontend/common/views/dashboard/settings/types/siteContentSettings.types";
import { buildSiteContentColumns } from "@/frontend/common/views/dashboard/settings/utils/siteContentColumns";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button/DesktopActionButtons";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container/DesktopSectionPanel";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid";

export function SiteContentSettingsTabDesktopView({
  rows,
  loading,
  canManage,
  labels,
  formOpen,
  editRow,
  deleteRow,
  isDeleting,
  togglingPublishId,
  onAdd,
  onEdit,
  onDelete,
  onFormClose,
  onDeleteClose,
  onSaved,
  onConfirmDelete,
  onTogglePublish,
}: Readonly<SiteContentSettingsViewModel>) {
  const columns = useMemo<GridColDef[]>(
    () =>
      buildSiteContentColumns(
        labels,
        {
          onEdit,
          onDelete,
          onTogglePublish: (row, isPublished) => {
            void onTogglePublish(row, isPublished);
          },
        },
        canManage,
        togglingPublishId
      ),
    [labels, onEdit, onDelete, onTogglePublish, canManage, togglingPublishId]
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
          <SiteContentEntryFormDialog
            open={formOpen}
            row={editRow}
            labels={labels}
            onClose={onFormClose}
            onSaved={onSaved}
          />
          <SiteContentEntryDeleteDialog
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
