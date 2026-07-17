"use client";

import { Box, FormHelperText, TextField } from "@mui/material";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { durationBoxSx, labelSx } from "@/frontend/common/components/ui/form";
import type { RecurringClassFormData } from "@/frontend/common/views/dashboard/classes/recurring/recurringClassSchema";

export interface DurationInputMobileProps {
  readonly register: UseFormRegister<RecurringClassFormData>;
  readonly errors: FieldErrors<RecurringClassFormData>;
  readonly isSubmitting: boolean;
  readonly labels: {
    readonly duration: string;
    readonly durationHours: string;
    readonly durationMinutes: string;
    readonly hours: string;
    readonly minutes: string;
  };
}

export function DurationInputMobile({ register, errors, isSubmitting, labels }: DurationInputMobileProps) {
  const mainLabel = labels.durationHours.replace("(Hrs)", "").trim();

  return (
    <Box>
      <Box component="label" sx={labelSx}>
        {mainLabel}
      </Box>
      <Box sx={{ display: "flex", gap: 2, flexDirection: "column" }}>
        <DurationField
          register={register}
          fieldName="durationHours"
          label={labels.durationHours}
          max={12}
          isSubmitting={isSubmitting}
          error={!!errors.durationHours}
        />
        <DurationField
          register={register}
          fieldName="durationMinutes"
          label={labels.durationMinutes}
          max={59}
          isSubmitting={isSubmitting}
          error={!!errors.durationMinutes}
        />
      </Box>
      {(errors.durationHours ?? errors.durationMinutes) && (
        <FormHelperText error sx={{ mt: 1 }}>
          {errors.durationHours?.message ?? errors.durationMinutes?.message}
        </FormHelperText>
      )}
    </Box>
  );
}

interface DurationFieldProps {
  readonly register: UseFormRegister<RecurringClassFormData>;
  readonly fieldName: "durationHours" | "durationMinutes";
  readonly label: string;
  readonly max: number;
  readonly isSubmitting: boolean;
  readonly error: boolean;
}

function DurationField({ register, fieldName, label, max, isSubmitting, error }: DurationFieldProps) {
  return (
    <Box sx={{ flex: 1 }}>
      <Box component="label" sx={labelSx}>
        {label}
      </Box>
      <Box sx={durationBoxSx(true)}>
        <TextField
          {...register(fieldName, { valueAsNumber: true })}
          type="number"
          disabled={isSubmitting}
          error={error}
          slotProps={{
            htmlInput: { min: 0, max },
            input: {
              sx: { textAlign: "center", p: 1, border: undefined },
            },
          }}
          variant="standard"
          sx={{ flex: 1 }}
        />
      </Box>
    </Box>
  );
}
