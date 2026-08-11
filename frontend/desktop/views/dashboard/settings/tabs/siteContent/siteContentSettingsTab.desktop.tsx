"use client";

import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { SiteContentEntryDeleteDialog } from "@/frontend/common/views/dashboard/settings/tabs/siteContent/components/SiteContentEntryDeleteDialog";
import { SiteContentEntryFormDialog } from "@/frontend/common/views/dashboard/settings/tabs/siteContent/components/SiteContentEntryFormDialog";
import type { SiteContentSettingsViewModel } from "@/frontend/common/views/dashboard/settings/types/siteContentSettings.types";
import { buildSiteContentColumns } from "@/frontend/common/views/dashboard/settings/utils/siteContentColumns";
import { SettingsTabGridShared } from "@/frontend/desktop/views/dashboard/settings/tabs/__shared__/settingsTabGridShared";

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
      }
    />
  );
}
