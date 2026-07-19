"use client";

import { Box, FormHelperText, TextField, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { durationBoxSx, labelSx } from "@/frontend/common/components/ui/form";
import type { RecurringClassFormData } from "@/frontend/common/views/dashboard/classes/recurring/recurringClassSchema";
import type { DurationInputProps } from "@/frontend/common/views/dashboard/classes/recurring/types";

const StyledDurationUnitLabel = styled(Typography)(({ theme }) => ({
  ...theme.typography.labelMd,
  color: theme.palette.onSurfaceVariant,
  textTransform: "uppercase",
}));

export function DurationInputDesktop({ register, errors, isSubmitting, labels }: DurationInputProps) {
  const mainLabel = labels.duration;

  return (
    <Box>
      <Box component="label" sx={labelSx}>
        {mainLabel}
      </Box>
      <Box sx={{ display: "flex", gap: 2, flexDirection: "row" }}>
        <DurationField
          register={register}
          fieldName="durationHours"
          label={labels.durationHours}
          unit={labels.hours}
          max={12}
          isSubmitting={isSubmitting}
          error={!!errors.durationHours}
        />
        <DurationField
          register={register}
          fieldName="durationMinutes"
          label={labels.durationMinutes}
          unit={labels.minutes}
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
  readonly register: import("react-hook-form").UseFormRegister<RecurringClassFormData>;
  readonly fieldName: "durationHours" | "durationMinutes";
  readonly label: string;
  readonly unit: string;
  readonly max: number;
  readonly isSubmitting: boolean;
  readonly error: boolean;
}

function DurationField({ register, fieldName, unit, max, isSubmitting, error }: DurationFieldProps) {
  return (
    <Box sx={{ flex: 1 }}>
      <Box sx={durationBoxSx(false)}>
        <TextField
          {...register(fieldName, { valueAsNumber: true })}
          type="number"
          disabled={isSubmitting}
          error={error}
          slotProps={{
            htmlInput: { min: 0, max },
            input: {
              sx: {
                textAlign: "center",
                p: 1,
                backgroundColor: "transparent",
                "& fieldset": { border: "none" },
              },
            },
          }}
        />
        <StyledDurationUnitLabel>{unit}</StyledDurationUnitLabel>
      </Box>
    </Box>
  );
}
