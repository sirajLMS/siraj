"use client";

import { Box, FormHelperText, TextField } from "@mui/material";
import { outlinedInputSx } from "@/frontend/common/components/ui/form";
import type { DurationInputProps } from "@/frontend/common/views/dashboard/classes/recurring/types";

export function DurationInputDesktop({ register, errors, isSubmitting, labels }: DurationInputProps) {
  const hasError = !!(errors.durationHours ?? errors.durationMinutes);

  return (
    <Box>
      <Box sx={{ display: "flex", flexDirection: "row", gap: 2, width: "100%" }}>
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
        <FormHelperText error>
          {errors.durationHours?.message ?? errors.durationMinutes?.message}
        </FormHelperText>
      )}
    </Box>
  );
}
