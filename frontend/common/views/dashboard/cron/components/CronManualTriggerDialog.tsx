"use client";

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import type { CronScheduleFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import type { CronLabels } from "@/shared/locale/types/dashboard/cron";

export interface CronManualTriggerDialogProps {
  readonly open: boolean;
  readonly schedule: CronScheduleFieldsFragment | null;
  readonly labels: CronLabels;
  readonly triggering: boolean;
  readonly onConfirm: () => void;
  readonly onClose: () => void;
}

export function CronManualTriggerDialog({
  open,
  schedule,
  labels,
  triggering,
  onConfirm,
  onClose,
}: Readonly<CronManualTriggerDialogProps>) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{labels.manualTriggerConfirmTitle}</DialogTitle>
      <DialogContent>
        <Stack spacing={1}>
          <Typography>{labels.manualTriggerConfirmMessage(schedule?.name ?? "")}</Typography>
          <Typography sx={{ color: theme => theme.palette.warning.main }} variant="body2">
            {labels.errors.concurrencyConflict}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={triggering} variant="text">
          {labels.manualTriggerCancel}
        </Button>
        <Button onClick={onConfirm} disabled={triggering} variant="contained" color="warning">
          {triggering ? labels.loading : labels.manualTriggerConfirmButton}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
