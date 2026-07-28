"use client";

import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog/BaseDeleteDialog";
import type { SystemSettingRow } from "@/frontend/common/views/dashboard/settings/types/generalSettings.types";
import type { SettingsGeneralTabLabels } from "@/shared/locale/types/dashboard/settings/general";

export interface SystemSettingDeleteDialogProps {
  readonly open: boolean;
  readonly row: SystemSettingRow | null;
  readonly labels: SettingsGeneralTabLabels;
  readonly isLoading: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}

export function SystemSettingDeleteDialog({
  open,
  row,
  labels,
  isLoading,
  onClose,
  onConfirm,
}: Readonly<SystemSettingDeleteDialogProps>) {
  return (
    <BaseDeleteDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
      title={labels.deleteConfirmTitle}
      body={row?.key ? labels.deleteConfirmBody(row.key) : ""}
      cancelLabel={labels.deleteConfirmCancel}
      confirmLabel={labels.deleteConfirmConfirm}
    />
  );
}
