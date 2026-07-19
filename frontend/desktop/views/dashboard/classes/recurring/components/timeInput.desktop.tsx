"use client";

import { ScheduleOutlined } from "@mui/icons-material";
import { InputAdornment } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Controller } from "react-hook-form";
import { AppTimePicker, timeInputOutlinedSx } from "@/frontend/common/components/ui/form";
import type { TimeInputProps } from "@/frontend/common/views/dashboard/classes/recurring/types";
import { formatTimeValue, parseTimeValue } from "@/frontend/common/views/dashboard/classes/recurring/utils";

const StyledScheduleLeadingIcon = styled(ScheduleOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

export function TimeInputDesktop({ label, control, isSubmitting, error }: TimeInputProps) {
  return (
    <Controller
      name="defaultStartTime"
      control={control}
      render={({ field }) => (
        <AppTimePicker
          value={parseTimeValue(field.value)}
          onChange={(date: Date | null) => {
            field.onChange(formatTimeValue(date));
          }}
          disabled={isSubmitting}
          slotProps={{
            textField: {
              label,
              fullWidth: true,
              error: !!error,
              helperText: error,
              variant: "outlined",
              sx: timeInputOutlinedSx,
              slotProps: {
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <StyledScheduleLeadingIcon />
                    </InputAdornment>
                  ),
                },
              },
            },
          }}
        />
      )}
    />
  );
}
