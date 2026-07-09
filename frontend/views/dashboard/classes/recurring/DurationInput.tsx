"use client";

import { Box, FormHelperText, TextField, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { durationBoxSx, labelSx } from "@/frontend/components/ui/form";
import type { RecurringClassFormData } from "@/frontend/views/dashboard/classes/recurring/recurringClassSchema";

// Uppercase onSurfaceVariant label-sized caption used beside the duration input as a unit label
const StyledDurationUnitLabel = styled(Typography)(({ theme }) => ({
  ...theme.typography.labelMd,
  color: theme.palette.onSurfaceVariant,
  textTransform: "uppercase",
}));

interface DurationInputProps {
  readonly register: UseFormRegister<RecurringClassFormData>;
  readonly errors: FieldErrors<RecurringClassFormData>;
  readonly isSubmitting: boolean;
  readonly isMobile: boolean;
  readonly labels: {
    readonly duration: string;
    readonly durationHours: string;
    readonly durationMinutes: string;
    readonly hours: string;
    readonly minutes: string;
  };
}

export function DurationInput({ register, errors, isSubmitting, isMobile, labels }: DurationInputProps) {
  const mainLabel = isMobile ? labels.durationHours.replace("(Hrs)", "").trim() : labels.duration;

  return (
    <Box>
      <Box component="label" sx={labelSx}>
        {mainLabel}
      </Box>
      <Box sx={{ display: "flex", gap: 2, flexDirection: isMobile ? "column" : "row" }}>
        <DurationField
          register={register}
          fieldName="durationHours"
          label={labels.durationHours}
          unit={labels.hours}
          max={12}
          isSubmitting={isSubmitting}
          isMobile={isMobile}
          error={!!errors.durationHours}
        />
        <DurationField
          register={register}
          fieldName="durationMinutes"
          label={labels.durationMinutes}
          unit={labels.minutes}
          max={59}
          isSubmitting={isSubmitting}
          isMobile={isMobile}
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
  readonly unit: string;
  readonly max: number;
  readonly isSubmitting: boolean;
  readonly isMobile: boolean;
  readonly error: boolean;
}

function DurationField({ register, fieldName, label, unit, max, isSubmitting, isMobile, error }: DurationFieldProps) {
  return (
    <Box sx={{ flex: 1 }}>
      {isMobile && (
        <Box component="label" sx={labelSx}>
          {label}
        </Box>
      )}
      <Box sx={durationBoxSx(isMobile)}>
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
        {!isMobile && <StyledDurationUnitLabel>{unit}</StyledDurationUnitLabel>}
      </Box>
    </Box>
  );
}
