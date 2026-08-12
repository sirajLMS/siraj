"use client";

import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { SessionConfigDialogsShared } from "@/frontend/common/views/dashboard/settings/tabs/session/__shared__/sessionConfigDialogsShared";
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
        <SessionConfigDialogsShared
          formOpen={formOpen}
          editRow={editRow}
          deleteRow={deleteRow}
          isDeleting={isDeleting}
          labels={labels}
          onFormClose={onFormClose}
          onSaved={onSaved}
          onDeleteClose={onDeleteClose}
          onConfirmDelete={onConfirmDelete}
        />
      }
    />
  );
}
