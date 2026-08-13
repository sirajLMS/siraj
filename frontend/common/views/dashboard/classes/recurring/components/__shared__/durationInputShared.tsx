"use client";

import { Box, FormHelperText, TextField } from "@mui/material";
import { outlinedInputSx } from "@/frontend/common/components/ui/form/field";
import type { DurationInputProps } from "@/frontend/common/views/dashboard/classes/recurring/types";

export interface DurationInputSharedOptions {
  readonly fieldGap: number;
}

export function DurationInputShared({
  register,
  errors,
  isSubmitting,
  labels,
  options,
}: DurationInputProps & { readonly options: DurationInputSharedOptions }) {
  const hasError = !!(errors.durationHours ?? errors.durationMinutes);

  return (
    <Box>
      <Box sx={{ display: "flex", flexDirection: "row", gap: options.fieldGap, width: "100%" }}>
        <TextField
          {...register("durationHours", { valueAsNumber: true })}
          type="number"
          label={labels.hours}
          disabled={isSubmitting}
          error={!!errors.durationHours}
          fullWidth
          variant="outlined"
          sx={outlinedInputSx}
          slotProps={{
            htmlInput: { min: 0, max: 12, "aria-label": labels.durationHours, inputMode: "numeric" },
            inputLabel: { shrink: true },
          }}
        />
        <TextField
          {...register("durationMinutes", { valueAsNumber: true })}
          type="number"
          label={labels.minutes}
          disabled={isSubmitting}
          error={!!errors.durationMinutes}
          fullWidth
          variant="outlined"
          sx={outlinedInputSx}
          slotProps={{
            htmlInput: { min: 0, max: 59, "aria-label": labels.durationMinutes, inputMode: "numeric" },
            inputLabel: { shrink: true },
          }}
        />
      </Box>
      {hasError && (
        <FormHelperText error>{errors.durationHours?.message ?? errors.durationMinutes?.message}</FormHelperText>
      )}
    </Box>
  );
}
