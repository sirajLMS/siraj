"use client";

import { Box, FormControl, FormHelperText, FormLabel, TextField, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { durationBoxSx } from "@/frontend/common/components/ui/form";
import type { RecurringClassFormData } from "@/frontend/common/views/dashboard/classes/recurring/recurringClassSchema";
import type { DurationInputProps } from "@/frontend/common/views/dashboard/classes/recurring/types";

const StyledDurationUnitLabel = styled(Typography)(({ theme }) => ({
  ...theme.typography.labelMd,
  color: theme.palette.onSurfaceVariant,
  textTransform: "uppercase",
  flexShrink: 0,
}));

export function DurationInputMobile({ register, errors, isSubmitting, labels }: DurationInputProps) {
  const hasError = !!(errors.durationHours ?? errors.durationMinutes);

  return (
    <FormControl component="fieldset" fullWidth error={hasError}>
      <FormLabel component="legend">{labels.duration}</FormLabel>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 1.5,
          mt: 1,
          width: "100%",
        }}
      >
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
      {hasError && (
        <FormHelperText error>
          {errors.durationHours?.message ?? errors.durationMinutes?.message}
        </FormHelperText>
      )}
    </FormControl>
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

function DurationField({ register, fieldName, label, unit, max, isSubmitting, error }: DurationFieldProps) {
  return (
    <FormControl error={error} sx={{ flex: 1, minWidth: 0 }}>
      <FormLabel>{label}</FormLabel>
      <Box sx={[durationBoxSx(true), { flexDirection: "row", width: "100%" }]}>
        <TextField
          {...register(fieldName, { valueAsNumber: true })}
          type="number"
          disabled={isSubmitting}
          error={error}
          fullWidth
          size="small"
          slotProps={{
            htmlInput: { min: 0, max, inputMode: "numeric" },
            input: {
              sx: {
                textAlign: "center",
                py: 0.5,
                px: 1,
                backgroundColor: "transparent",
                flex: 1,
                minWidth: 0,
                "& fieldset": { border: "none" },
              },
            },
          }}
        />
        <StyledDurationUnitLabel>{unit}</StyledDurationUnitLabel>
      </Box>
    </FormControl>
  );
}
