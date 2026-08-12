"use client";

import { SessionConfigDeleteDialog } from "@/frontend/common/views/dashboard/settings/tabs/session/components/SessionConfigDeleteDialog";
import { SessionConfigFormDialog } from "@/frontend/common/views/dashboard/settings/tabs/session/components/SessionConfigFormDialog";
import type { SessionConfigTabViewModel } from "@/frontend/common/views/dashboard/settings/types/sessionConfig.types";

type SessionConfigDialogsSharedProps = Pick<
  SessionConfigTabViewModel,
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

export function SessionConfigDialogsShared({
  formOpen,
  editRow,
  deleteRow,
  isDeleting,
  labels,
  onFormClose,
  onSaved,
  onDeleteClose,
  onConfirmDelete,
}: Readonly<SessionConfigDialogsSharedProps>) {
  return (
    <>
      <SessionConfigFormDialog open={formOpen} row={editRow} labels={labels} onClose={onFormClose} onSaved={onSaved} />
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
  );
}
