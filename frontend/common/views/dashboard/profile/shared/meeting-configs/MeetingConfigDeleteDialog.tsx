"use client";

import { useTranslations } from "next-intl";
import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog/BaseDeleteDialog";

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
  const t = useTranslations("ui.meetingConfig.manager");

  return (
    <BaseDeleteDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
      title={t("deleteTitle")}
      body={t("deleteBody", { name: configLabel })}
      cancelLabel={t("cancel")}
      confirmLabel={t("deleteConfirm")}
    />
  );
}
