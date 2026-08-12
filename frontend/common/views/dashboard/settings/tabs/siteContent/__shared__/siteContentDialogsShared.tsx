"use client";

import { SiteContentEntryDeleteDialog } from "@/frontend/common/views/dashboard/settings/tabs/siteContent/components/SiteContentEntryDeleteDialog";
import { SiteContentEntryFormDialog } from "@/frontend/common/views/dashboard/settings/tabs/siteContent/components/SiteContentEntryFormDialog";
import type { SiteContentSettingsViewModel } from "@/frontend/common/views/dashboard/settings/types/siteContentSettings.types";

type SiteContentDialogsSharedProps = Pick<
  SiteContentSettingsViewModel,
  | "formOpen"
  | "editRow"
  | "deleteRow"
  | "isDeleting"
  | "labels"
  | "onFormClose"
  | "onSaved"
  | "onDeleteClose"
  | "onConfirmDelete"
>;

export function SiteContentDialogsShared({
  formOpen,
  editRow,
  deleteRow,
  isDeleting,
  labels,
  onFormClose,
  onSaved,
  onDeleteClose,
  onConfirmDelete,
}: Readonly<SiteContentDialogsSharedProps>) {
  return (
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
  );
}
