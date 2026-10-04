"use client";

import { FormControl, FormControlLabel, FormLabel, MenuItem, Radio, RadioGroup, Stack, TextField } from "@mui/material";
import { CronConcurrencyPolicy } from "@/frontend/common/graphql/generated/gql/graphql";
import type { CronScheduleFormFieldProps } from "@/frontend/common/views/dashboard/cron/components/CronScheduleCreateEditDialog.fields";
import { safeEnum } from "@/frontend/common/views/dashboard/cron/utils";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
] as const;

export function CronTimezoneSelect({ form, labels, setForm }: Readonly<CronScheduleFormFieldProps>) {
  return (
    <TextField
      select
      label={labels.fieldTimezone}
      value={form.timezone}
      onChange={e => setForm(prev => ({ ...prev, timezone: e.target.value }))}
      fullWidth
    >
      {TIMEZONES.map(tz => (
        <MenuItem key={tz} value={tz}>
          {tz}
        </MenuItem>
      ))}
    </TextField>
  );
}

export function CronConcurrencyPolicyRadio({ form, labels, setForm }: Readonly<CronScheduleFormFieldProps>) {
  return (
    <FormControl>
      <FormLabel>{labels.fieldConcurrencyPolicy}</FormLabel>
      <RadioGroup
        row
        value={form.concurrencyPolicy}
        onChange={e =>
          setForm(prev => ({
            ...prev,
            concurrencyPolicy: safeEnum(e.target.value, Object.values(CronConcurrencyPolicy)) ?? prev.concurrencyPolicy,
          }))
        }
      >
        <FormControlLabel value={CronConcurrencyPolicy.Allow} control={<Radio />} label={labels.concurrencyAllow} />
        <FormControlLabel value={CronConcurrencyPolicy.Skip} control={<Radio />} label={labels.concurrencySkip} />
        <FormControlLabel value={CronConcurrencyPolicy.Replace} control={<Radio />} label={labels.concurrencyReplace} />
      </RadioGroup>
    </FormControl>
  );
}

export function CronRetryFields({ form, labels, setForm }: Readonly<CronScheduleFormFieldProps>) {
  return (
    <>
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
    </>
  );
}
