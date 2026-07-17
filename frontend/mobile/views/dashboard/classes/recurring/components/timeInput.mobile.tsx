"use client";

import { ScheduleOutlined } from "@mui/icons-material";
import { Box, InputAdornment } from "@mui/material";
import { styled } from "@mui/material/styles";
import { format, isValid, parse } from "date-fns";
import { type Control, Controller } from "react-hook-form";
import { AppTimePicker, labelSx, timeInputOutlinedSx } from "@/frontend/common/components/ui/form";
import type { RecurringClassFormData } from "@/frontend/common/views/dashboard/classes/recurring/recurringClassSchema";

const TIME_FORMAT = "HH:mm";

const StyledScheduleLeadingIcon = styled(ScheduleOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

function parseTimeValue(timeStr: string): Date | null {
  if (!timeStr) return null;
  const parsed = parse(timeStr, TIME_FORMAT, new Date());
  return isValid(parsed) ? parsed : null;
}

export interface TimeInputMobileProps {
  readonly label: string;
  readonly control: Control<RecurringClassFormData>;
  readonly isSubmitting: boolean;
  readonly error?: string;
}

export function TimeInputMobile({ label, control, isSubmitting, error }: TimeInputMobileProps) {
  return (
    <>
      <Box component="label" sx={labelSx}>
        {label}
      </Box>
      <Controller
        name="defaultStartTime"
        control={control}
        render={({ field }) => (
          <AppTimePicker
            value={parseTimeValue(field.value)}
            onChange={(date: Date | null) => {
              field.onChange(date && isValid(date) ? format(date, TIME_FORMAT) : "");
            }}
            disabled={isSubmitting}
            slotProps={{
              textField: {
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
    </>
  );
}
