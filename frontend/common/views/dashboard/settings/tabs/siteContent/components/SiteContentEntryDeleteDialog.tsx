"use client";

import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog/BaseDeleteDialog";
import type { SiteContentRow } from "@/frontend/common/views/dashboard/settings/types/siteContentSettings.types";
import type { SettingsSiteContentTabLabels } from "@/shared/locale/types/dashboard/settings/siteContent";

export interface SiteContentEntryDeleteDialogProps {
  readonly open: boolean;
  readonly row: SiteContentRow | null;
  readonly labels: SettingsSiteContentTabLabels;
  readonly isLoading: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}

export function SiteContentEntryDeleteDialog({
  open,
  row,
  labels,
  isLoading,
  onClose,
  onConfirm,
}: Readonly<SiteContentEntryDeleteDialogProps>) {
  return (
    <BaseDeleteDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
      title={labels.deleteConfirmTitle}
      body={row?.title ? labels.deleteConfirmBody(row.title) : ""}
      cancelLabel={labels.deleteConfirmCancel}
      confirmLabel={labels.deleteConfirmConfirm}
    />
  );
}
