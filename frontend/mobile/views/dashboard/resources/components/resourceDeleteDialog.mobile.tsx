"use client";

import type { ResourceDeleteDialogProps } from "@/frontend/common/views/dashboard/resources/types/resourcesTypes";
import { MobileBaseDeleteDialog } from "@/frontend/mobile/components/ui/dialog/MobileBaseDeleteDialog";

export function ResourceDeleteDialogMobile({
  labels,
  open,
  resourceTitle,
  onCancel,
  onConfirm,
  loading = false,
}: Readonly<ResourceDeleteDialogProps>) {
  const titleName = resourceTitle ?? "this resource";
  const bodyText = labels.deleteDialog.body(titleName);

  return (
    <MobileBaseDeleteDialog
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
