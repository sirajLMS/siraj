"use client";

import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog/BaseDeleteDialog";
import { useAppTranslation } from "@/shared/locale";

export type MeetingConfigDeleteDialogProps = {
  readonly open: boolean;
  readonly configLabel: string;
  readonly isLoading: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
};

export function MeetingConfigDeleteDialog({
  open,
  configLabel,
  isLoading,
  onClose,
  onConfirm,
}: MeetingConfigDeleteDialogProps) {
  const t = useAppTranslation().uiTranslations.meetingConfigManager;

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
