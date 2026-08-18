"use client";

import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog";
import type { DeleteGroupDialogSharedProps } from "@/frontend/common/views/dashboard/permissions/types/deleteGroupDialogShared.types";

export function DeleteGroupDialogShared({ labels, props, slots }: Readonly<DeleteGroupDialogSharedProps>) {
  const { open, groupName, isLoading, onClose, onConfirm } = props;
  const t = labels;
  const { dialogVariant } = slots;

  return (
    <BaseDeleteDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
      title={t.deleteConfirmTitle}
      body={t.deleteConfirmBody(groupName)}
      cancelLabel={t.cancel}
      confirmLabel={t.actionDelete}
      fullScreen={dialogVariant.fullScreen}
    />
  );
}
