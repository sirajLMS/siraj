"use client";

import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { SessionConfigDeleteDialog } from "@/frontend/common/views/dashboard/settings/tabs/session/components/SessionConfigDeleteDialog";
import { SessionConfigFormDialog } from "@/frontend/common/views/dashboard/settings/tabs/session/components/SessionConfigFormDialog";
import type { SessionConfigTabViewModel } from "@/frontend/common/views/dashboard/settings/types/sessionConfig.types";
import { buildSessionConfigColumns } from "@/frontend/common/views/dashboard/settings/utils/sessionConfigColumns";
import { SettingsTabGridShared } from "@/frontend/desktop/views/dashboard/settings/tabs/__shared__/settingsTabGridShared";

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
    <SettingsTabGridShared
      rows={rows}
      loading={loading}
      canManage={canManage}
      title={labels.title}
      subtitle={labels.subtitle}
      addLabel={labels.addLabel}
      emptyMessage={labels.empty}
      onAdd={onAdd}
      columns={columns}
      dialogs={
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
      }
    />
  );
}
