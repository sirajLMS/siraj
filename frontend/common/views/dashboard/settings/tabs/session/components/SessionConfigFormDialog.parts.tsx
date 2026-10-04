"use client";

import { Stack, TextField } from "@mui/material";
import { type Control, Controller, type FieldErrors } from "react-hook-form";
import type {
  SessionConfigFormInput,
  SessionConfigFormValues,
} from "@/frontend/common/views/dashboard/settings/schemas/sessionConfigForm.schema";
import type { SettingsSessionTabLabels } from "@/shared/locale/types/dashboard/settings/session";

interface SessionConfigFormFieldsProps {
  readonly control: Control<SessionConfigFormInput, undefined, SessionConfigFormValues>;
  readonly errors: FieldErrors<SessionConfigFormInput>;
  readonly labels: SettingsSessionTabLabels;
  readonly isEdit: boolean;
}

export function SessionConfigFormFields({ control, errors, labels, isEdit }: Readonly<SessionConfigFormFieldsProps>) {
  return (
    <Stack spacing={2.5} sx={{ pt: 1 }}>
      <Controller
        name="roleName"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={labels.roleNameField}
            helperText={errors.roleName?.message ?? labels.roleNameHelp}
            error={Boolean(errors.roleName)}
            fullWidth
            required
            disabled={isEdit}
          />
        )}
      />

      <Controller
        name="ttlSeconds"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            type="number"
            label={labels.ttlSecondsField}
            helperText={errors.ttlSeconds?.message ?? labels.ttlSecondsHelp}
            error={Boolean(errors.ttlSeconds)}
            fullWidth
            required
            slotProps={{ htmlInput: { min: 60, max: 2419200 } }}
            onChange={event => {
              field.onChange(event.target.value === "" ? "" : Number(event.target.value));
            }}
          />
        )}
      />

      <Controller
        name="maxConcurrentSessions"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            type="number"
            label={labels.maxConcurrentSessionsField}
            helperText={errors.maxConcurrentSessions?.message ?? labels.maxConcurrentSessionsHelp}
            error={Boolean(errors.maxConcurrentSessions)}
            fullWidth
            required
            slotProps={{ htmlInput: { min: 1, max: 50 } }}
            onChange={event => {
              field.onChange(event.target.value === "" ? "" : Number(event.target.value));
            }}
          />
        )}
      />
    </Stack>
  );
}
