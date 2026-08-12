"use client";

import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { SiteContentDialogsShared } from "@/frontend/common/views/dashboard/settings/tabs/siteContent/__shared__/siteContentDialogsShared";
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
        <SiteContentDialogsShared
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
