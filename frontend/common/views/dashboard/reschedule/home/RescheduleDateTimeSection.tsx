"use client";

import { CalendarTodayOutlined, ScheduleOutlined } from "@mui/icons-material";
import { Grid, InputAdornment } from "@mui/material";
import { format, isValid } from "date-fns";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { AppDatePicker, AppTimePicker, FieldWrapper, timeInputStandardSx } from "@/frontend/common/components/ui/form";
import type { RescheduleFormData } from "@/frontend/common/views/dashboard/reschedule/home/schemas/rescheduleSchema";
import {
  parseDateValue,
  parseTimeValue,
  RESCHEDULE_DATE_FORMAT,
  RESCHEDULE_TIME_FORMAT,
} from "@/frontend/common/views/dashboard/reschedule/home/utils/rescheduleDateTime";
import { useAppTranslation } from "@/shared/locale/client";

interface Props {
  readonly control: Control<RescheduleFormData>;
  readonly errors: FieldErrors<RescheduleFormData>;
}

export function RescheduleDateTimeSection({ control, errors }: Readonly<Props>) {
  const t = useAppTranslation().dashboardTranslations.rescheduleForm;

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <FieldWrapper
          label={t.fields.newDate}
          required
          error={errors.newDate ? t.validation[errors.newDate.message as keyof typeof t.validation] : undefined}
        >
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
                    fullWidth: true,
                    variant: "outlined",
                    error: !!errors.newDate,
                    slotProps: {
                      htmlInput: { autoComplete: "off" },
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarTodayOutlined
                              sx={theme => ({ color: theme.palette.primary.main, fontSize: 18 })}
                            />
                          </InputAdornment>
                        ),
                      },
                    },
                  },
                }}
              />
            )}
          />
        </FieldWrapper>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FieldWrapper
          label={t.fields.newTime}
          required
          error={errors.newTime ? t.validation[errors.newTime.message as keyof typeof t.validation] : undefined}
        >
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
                    fullWidth: true,
                    variant: "outlined",
                    error: !!errors.newTime,
                    sx: timeInputStandardSx,
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
        </FieldWrapper>
      </Grid>
    </Grid>
  );
}
