"use client";

import { MenuItem, TextField } from "@mui/material";
import { CronJobKind } from "@/frontend/common/graphql/generated/gql/graphql";
import type { CronScheduleFormData } from "@/frontend/common/views/dashboard/cron/types";
import { safeEnum } from "@/frontend/common/views/dashboard/cron/utils";
import type { CronLabels } from "@/shared/locale/types/dashboard/cron";

export interface CronScheduleFormFieldProps {
  readonly form: CronScheduleFormData;
  readonly labels: CronLabels;
  readonly setForm: React.Dispatch<React.SetStateAction<CronScheduleFormData>>;
  readonly preview: readonly string[];
}

export function CronBasicFields({ form, labels, setForm, preview }: Readonly<CronScheduleFormFieldProps>) {
  return (
    <>
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
    </>
  );
}

export function CronJobKindSelect({ form, labels, setForm }: Readonly<CronScheduleFormFieldProps>) {
  return (
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
  );
}

export function CronPayloadField({ form, labels, setForm }: Readonly<CronScheduleFormFieldProps>) {
  return (
    <TextField
      label={labels.fieldPayload}
      value={form.payload}
      onChange={e => setForm(prev => ({ ...prev, payload: e.target.value }))}
      multiline
      rows={3}
      fullWidth
      placeholder='{"key": "value"}'
    />
  );
}
