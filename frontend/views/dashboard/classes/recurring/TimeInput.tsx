"use client";

import { ScheduleOutlined } from "@mui/icons-material";
import { InputAdornment, Typography } from "@mui/material";
import { format, isValid, parse } from "date-fns";
import { type Control, Controller } from "react-hook-form";
import { AppTimePicker, labelSx, timeInputOutlinedSx, timeInputStandardSx } from "@/frontend/components/ui/form";
import type { RecurringClassFormData } from "./recurringClassSchema";

const TIME_FORMAT = "HH:mm";

function parseTimeValue(timeStr: string): Date | null {
  if (!timeStr) return null;
  const parsed = parse(timeStr, TIME_FORMAT, new Date());
  return isValid(parsed) ? parsed : null;
}

interface TimeInputProps {
  readonly label: string;
  readonly control: Control<RecurringClassFormData>;
  readonly isSubmitting: boolean;
  readonly isMobile: boolean;
  readonly error?: string;
}

export function TimeInput({ label, control, isSubmitting, isMobile, error }: TimeInputProps) {
  return (
    <>
      <Typography component="label" sx={labelSx}>
        {label}
      </Typography>
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
                variant: isMobile ? "outlined" : "standard",
                sx: isMobile ? timeInputOutlinedSx : timeInputStandardSx,
                slotProps: {
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <ScheduleOutlined sx={theme => ({ color: theme.palette.primary.main })} />
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
