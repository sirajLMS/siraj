"use client";

import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog/BaseDeleteDialog";
import type { SessionConfigRow } from "@/frontend/common/views/dashboard/settings/types/sessionConfig.types";
import type { SettingsSessionTabLabels } from "@/shared/locale/types/dashboard/settings/session";

export interface SessionConfigDeleteDialogProps {
  readonly open: boolean;
  readonly row: SessionConfigRow | null;
  readonly labels: SettingsSessionTabLabels;
  readonly isLoading: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}

export function SessionConfigDeleteDialog({
  open,
  row,
  labels,
  isLoading,
  onClose,
  onConfirm,
}: Readonly<SessionConfigDeleteDialogProps>) {
  return (
    <BaseDeleteDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
      title={labels.deleteConfirmTitle}
      body={row?.roleName ? labels.deleteConfirmBody(row.roleName) : ""}
      cancelLabel={labels.deleteConfirmCancel}
      confirmLabel={labels.deleteConfirmConfirm}
    />
  );
}
