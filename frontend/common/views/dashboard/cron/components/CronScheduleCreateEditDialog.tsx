"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CronConcurrencyPolicy, CronJobKind } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { CronScheduleFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import type { CronScheduleFormData } from "@/frontend/common/views/dashboard/cron/types";
import { EMPTY_FORM } from "@/frontend/common/views/dashboard/cron/types";
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
  const isEdit = editingSchedule != null;

  useEffect(() => {
    if (open) {
      setForm(editingSchedule ? toFormData(editingSchedule) : EMPTY_FORM);
    }
  }, [open, editingSchedule]);

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

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? labels.dialogEditTitle : labels.dialogCreateTitle}</DialogTitle>
      <form id={FORM_ID} onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={2}>
            <TextField
              label={labels.fieldName}
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label={labels.fieldDescription}
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={2}
              fullWidth
            />
            <TextField
              label={labels.fieldCronExpression}
              value={form.cronExpression}
              onChange={e => setForm(prev => ({ ...prev, cronExpression: e.target.value }))}
              required
              fullWidth
              helperText={preview.length > 0 ? `${labels.previewNextRuns}: ${preview.join(", ")}` : undefined}
            />
            <TextField
              select
              label={labels.fieldJobKind}
              value={form.jobKind}
              onChange={e =>
                setForm(prev => ({
                  ...prev,
                  jobKind: safeEnum(e.target.value, Object.values(CronJobKind)) ?? prev.jobKind,
                }))
              }
              fullWidth
            >
              <MenuItem value={CronJobKind.Noop}>{labels.jobKindNoop}</MenuItem>
            </TextField>
            <TextField
              label={labels.fieldPayload}
              value={form.payload}
              onChange={e => setForm(prev => ({ ...prev, payload: e.target.value }))}
              multiline
              rows={3}
              fullWidth
              placeholder='{"key": "value"}'
            />
            <TextField
              select
              label={labels.fieldTimezone}
              value={form.timezone}
              onChange={e => setForm(prev => ({ ...prev, timezone: e.target.value }))}
              fullWidth
            >
              <MenuItem value="UTC">UTC</MenuItem>
              <MenuItem value="America/New_York">America/New_York</MenuItem>
              <MenuItem value="America/Chicago">America/Chicago</MenuItem>
              <MenuItem value="America/Denver">America/Denver</MenuItem>
              <MenuItem value="America/Los_Angeles">America/Los_Angeles</MenuItem>
              <MenuItem value="Europe/London">Europe/London</MenuItem>
              <MenuItem value="Europe/Paris">Europe/Paris</MenuItem>
              <MenuItem value="Europe/Berlin">Europe/Berlin</MenuItem>
              <MenuItem value="Asia/Dubai">Asia/Dubai</MenuItem>
              <MenuItem value="Asia/Riyadh">Asia/Riyadh</MenuItem>
              <MenuItem value="Asia/Tokyo">Asia/Tokyo</MenuItem>
              <MenuItem value="Asia/Shanghai">Asia/Shanghai</MenuItem>
              <MenuItem value="Asia/Kolkata">Asia/Kolkata</MenuItem>
              <MenuItem value="Australia/Sydney">Australia/Sydney</MenuItem>
            </TextField>
            <FormControl>
              <FormLabel>{labels.fieldConcurrencyPolicy}</FormLabel>
              <RadioGroup
                row
                value={form.concurrencyPolicy}
                onChange={e =>
                  setForm(prev => ({
                    ...prev,
                    concurrencyPolicy:
                      safeEnum(e.target.value, Object.values(CronConcurrencyPolicy)) ?? prev.concurrencyPolicy,
                  }))
                }
              >
                <FormControlLabel
                  value={CronConcurrencyPolicy.Allow}
                  control={<Radio />}
                  label={labels.concurrencyAllow}
                />
                <FormControlLabel
                  value={CronConcurrencyPolicy.Skip}
                  control={<Radio />}
                  label={labels.concurrencySkip}
                />
                <FormControlLabel
                  value={CronConcurrencyPolicy.Replace}
                  control={<Radio />}
                  label={labels.concurrencyReplace}
                />
              </RadioGroup>
            </FormControl>
            <Stack direction="row" spacing={2}>
              <TextField
                label={labels.fieldMaxRetries}
                type="number"
                value={form.maxRetries}
                onChange={e =>
                  setForm(prev => ({ ...prev, maxRetries: e.target.value === "" ? "" : Number(e.target.value) }))
                }
                fullWidth
              />
              <TextField
                label={labels.fieldRetryBackoffSeconds}
                type="number"
                value={form.retryBackoffSeconds}
                onChange={e =>
                  setForm(prev => ({
                    ...prev,
                    retryBackoffSeconds: e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
                fullWidth
              />
            </Stack>
            <TextField
              label={labels.fieldTimeoutSeconds}
              type="number"
              value={form.timeoutSeconds}
              onChange={e =>
                setForm(prev => ({ ...prev, timeoutSeconds: e.target.value === "" ? "" : Number(e.target.value) }))
              }
              fullWidth
            />
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
