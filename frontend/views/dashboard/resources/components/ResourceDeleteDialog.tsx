"use client";

import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog/BaseDeleteDialog";
import type { ResourceDeleteDialogProps } from "@/frontend/views/dashboard/resources/types/resourcesTypes";

export function ResourceDeleteDialog({
  labels,
  open,
  resourceTitle,
  onCancel,
  onConfirm,
  loading = false,
}: Readonly<ResourceDeleteDialogProps>) {
  const titleName = resourceTitle ?? "this resource";
  const bodyText = labels.deleteDialog.body.replace("{title}", titleName);

  return (
    <BaseDeleteDialog
      open={open}
      onClose={onCancel}
      onConfirm={onConfirm}
      isLoading={loading}
      title={labels.deleteDialog.title}
      body={bodyText}
      cancelLabel={labels.deleteDialog.cancel}
      confirmLabel={labels.deleteDialog.confirm}
    />
  );
}
