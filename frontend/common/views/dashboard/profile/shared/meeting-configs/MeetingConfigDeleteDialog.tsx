"use client";

import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog/BaseDeleteDialog";
import type { MeetingConfigManagerLabels } from "@/shared/locale/types/ui";

export type MeetingConfigDeleteDialogProps = {
  readonly open: boolean;
  readonly configLabel: string;
  readonly isLoading: boolean;
  readonly labels: MeetingConfigManagerLabels;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
};

export function MeetingConfigDeleteDialog({
  open,
  configLabel,
  isLoading,
  labels,
  onClose,
  onConfirm,
}: MeetingConfigDeleteDialogProps) {
  const t = labels;

  return (
    <BaseDeleteDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
      title={t.deleteTitle}
      body={t.deleteBody(configLabel)}
      cancelLabel={t.cancel}
      confirmLabel={t.deleteConfirm}
    />
  );
}
