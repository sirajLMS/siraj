"use client";

import { CalendarTodayOutlined, ScheduleOutlined } from "@mui/icons-material";
import { Grid, InputAdornment } from "@mui/material";
import { format, isValid } from "date-fns";
import { type Control, Controller, type FieldErrors } from "react-hook-form";
import { AppDatePicker } from "@/frontend/common/components/ui/form/date";
import { timeInputOutlinedSx } from "@/frontend/common/components/ui/form/field";
import { AppTimePicker } from "@/frontend/common/components/ui/form/time";
import type { RescheduleFormData } from "@/frontend/common/views/dashboard/reschedule/home/schemas/rescheduleSchema";
import {
  parseDateValue,
  parseTimeValue,
  RESCHEDULE_DATE_FORMAT,
  RESCHEDULE_TIME_FORMAT,
} from "@/frontend/common/views/dashboard/reschedule/home/utils/rescheduleDateTime";
import type { RescheduleFormLabels } from "@/shared/locale/types/dashboard/classes/rescheduleForm";

type ValidationKey = keyof RescheduleFormLabels["validation"];

const VALIDATION_KEYS = new Set<string>(["dateRequired", "timeRequired"]);

function isValidationKey(value: string | undefined): value is ValidationKey {
  return value !== undefined && VALIDATION_KEYS.has(value);
}

function getValidationMessage(
  message: string | undefined,
  validation: RescheduleFormLabels["validation"]
): string | undefined {
  return isValidationKey(message) ? validation[message] : undefined;
}

interface Props {
  readonly labels: RescheduleFormLabels;
  readonly control: Control<RescheduleFormData>;
  readonly errors: FieldErrors<RescheduleFormData>;
}

export function RescheduleDateTimeSectionShared({ labels, control, errors }: Readonly<Props>) {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name="newDate"
          control={control}
          render={({ field }) => (
            <AppDatePicker
              value={parseDateValue(field.value)}
              onChange={(date: Date | null) => {
                field.onChange(date && isValid(date) ? format(date, RESCHEDULE_DATE_FORMAT) : "");
              }}
              slotProps={{
                textField: {
                  label: labels.fields.newDate,
                  required: true,
                  fullWidth: true,
                  variant: "outlined",
                  error: !!errors.newDate,
                  helperText: errors.newDate
                    ? getValidationMessage(errors.newDate.message, labels.validation)
                    : undefined,
                  slotProps: {
                    htmlInput: { autoComplete: "off" },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarTodayOutlined sx={theme => ({ color: theme.palette.primary.main, fontSize: 18 })} />
                        </InputAdornment>
                      ),
                    },
                  },
                },
              }}
            />
          )}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name="newTime"
          control={control}
          render={({ field }) => (
            <AppTimePicker
              value={parseTimeValue(field.value)}
              onChange={(date: Date | null) => {
                field.onChange(date && isValid(date) ? format(date, RESCHEDULE_TIME_FORMAT) : "");
              }}
              slotProps={{
                textField: {
                  label: labels.fields.newTime,
                  required: true,
                  fullWidth: true,
                  variant: "outlined",
                  error: !!errors.newTime,
                  helperText: errors.newTime
                    ? getValidationMessage(errors.newTime.message, labels.validation)
                    : undefined,
                  sx: timeInputOutlinedSx,
                  slotProps: {
                    htmlInput: { autoComplete: "off" },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <ScheduleOutlined sx={theme => ({ color: theme.palette.primary.main, fontSize: 18 })} />
                        </InputAdornment>
                      ),
                    },
                  },
                },
              }}
            />
          )}
        />
      </Grid>
    </Grid>
  );
}
