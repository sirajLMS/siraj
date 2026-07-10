"use client";

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { LocalizedStringDisplay } from "@/frontend/components/ui/display";
import type { MeetingProviderFieldsFragment } from "@/frontend/graphql/generated/gql/operations";

type DeleteMeetingProviderDialogProps = {
  readonly open: boolean;
  readonly provider: MeetingProviderFieldsFragment | null;
  readonly onClose: () => void;
  readonly onConfirm: () => void | Promise<void>;
};

export function DeleteMeetingProviderDialog({ open, provider, onClose, onConfirm }: DeleteMeetingProviderDialogProps) {
  const t = useTranslations("dashboard.meetingProviders");

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t("deleteTitle")}</DialogTitle>
      <DialogContent>
        <Typography sx={{ typography: "bodyMd" }}>
          {t("deleteConfirm")} <LocalizedStringDisplay value={provider?.name} typographyVariant="bodyMd" />
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("cancel")}</Button>
        <Button color="error" variant="contained" onClick={onConfirm}>
          {t("delete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
