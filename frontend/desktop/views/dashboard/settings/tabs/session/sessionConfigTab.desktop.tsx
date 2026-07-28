"use client";

import { AddOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { SessionConfigDeleteDialog } from "@/frontend/common/views/dashboard/settings/tabs/session/components/SessionConfigDeleteDialog";
import { SessionConfigFormDialog } from "@/frontend/common/views/dashboard/settings/tabs/session/components/SessionConfigFormDialog";
import type { SessionConfigTabViewModel } from "@/frontend/common/views/dashboard/settings/types/sessionConfig.types";
import { buildSessionConfigColumns } from "@/frontend/common/views/dashboard/settings/utils/sessionConfigColumns";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button/DesktopActionButtons";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container/DesktopSectionPanel";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid";

export function SessionConfigTabDesktopView({
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
}: Readonly<SessionConfigTabViewModel>) {
  const columns = useMemo<GridColDef[]>(
    () => buildSessionConfigColumns(labels, { onEdit, onDelete }, canManage),
    [labels, onEdit, onDelete, canManage]
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
          <SessionConfigFormDialog
            open={formOpen}
            row={editRow}
            labels={labels}
            onClose={onFormClose}
            onSaved={onSaved}
          />
          <SessionConfigDeleteDialog
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
