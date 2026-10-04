"use client";

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import {
  CronConcurrencyPolicy,
  CronJobKind,
  type CronScheduleFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  CronBasicFields,
  CronJobKindSelect,
  CronPayloadField,
  type CronScheduleFormFieldProps,
} from "@/frontend/common/views/dashboard/cron/components/CronScheduleCreateEditDialog.fields";
import {
  CronConcurrencyPolicyRadio,
  CronRetryFields,
  CronTimezoneSelect,
} from "@/frontend/common/views/dashboard/cron/components/CronScheduleCreateEditDialog.settings";
import { type CronScheduleFormData, EMPTY_FORM } from "@/frontend/common/views/dashboard/cron/types";
import { safeEnum } from "@/frontend/common/views/dashboard/cron/utils";
import type { CronLabels } from "@/shared/locale/types/dashboard/cron";

const FORM_ID = "cron-schedule-form";

function toFormData(row: CronScheduleFieldsFragment): CronScheduleFormData {
  return {
    name: row.name ?? "",
    description: row.description ?? "",
    cronExpression: row.cronExpression ?? "",
    jobKind: safeEnum(row.jobKind, Object.values(CronJobKind)) ?? CronJobKind.Noop,
    payload: row.payload ? JSON.stringify(row.payload) : "",
    timezone: row.timezone ?? "UTC",
    concurrencyPolicy:
      safeEnum(row.concurrencyPolicy, Object.values(CronConcurrencyPolicy)) ?? CronConcurrencyPolicy.Allow,
    maxRetries: row.maxRetries ?? 3,
    retryBackoffSeconds: row.retryBackoffSeconds ?? 60,
    timeoutSeconds: row.timeoutSeconds ?? 300,
  };
}

export interface CronScheduleCreateEditDialogProps {
  readonly open: boolean;
  readonly editingSchedule: CronScheduleFieldsFragment | null;
  readonly labels: CronLabels;
  readonly saving: boolean;
  readonly previewNextRuns: (expression: string, timezone: string) => string[];
  readonly onClose: () => void;
  readonly onSave: (data: CronScheduleFormData) => Promise<void>;
}

export function CronScheduleCreateEditDialog({
  open,
  editingSchedule,
  labels,
  saving,
  previewNextRuns,
  onClose,
  onSave,
}: Readonly<CronScheduleCreateEditDialogProps>) {
  const [form, setForm] = useState<CronScheduleFormData>(EMPTY_FORM);
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevEditingSchedule, setPrevEditingSchedule] = useState(editingSchedule);
  const isEdit = editingSchedule != null;

  if (open !== prevOpen || editingSchedule !== prevEditingSchedule) {
    setPrevOpen(open);
    setPrevEditingSchedule(editingSchedule);
    if (open) {
      setForm(editingSchedule ? toFormData(editingSchedule) : EMPTY_FORM);
    }
  }

  const preview = useMemo(
    () => previewNextRuns(form.cronExpression, form.timezone),
    [form.cronExpression, form.timezone, previewNextRuns]
  );

  const handleSubmit = useCallback(
    (e: React.SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();
      void onSave(form);
    },
    [form, onSave]
  );

  const fieldProps: CronScheduleFormFieldProps = { form, labels, setForm, preview };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? labels.dialogEditTitle : labels.dialogCreateTitle}</DialogTitle>
      <form id={FORM_ID} onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={2}>
            <CronBasicFields {...fieldProps} />
            <CronJobKindSelect {...fieldProps} />
            <CronPayloadField {...fieldProps} />
            <CronTimezoneSelect {...fieldProps} />
            <CronConcurrencyPolicyRadio {...fieldProps} />
            <CronRetryFields {...fieldProps} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} disabled={saving} variant="text">
            {labels.actionCancel}
          </Button>
          <Button type="submit" form={FORM_ID} disabled={saving} variant="contained">
            {saving ? labels.loading : labels.actionConfirm}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
