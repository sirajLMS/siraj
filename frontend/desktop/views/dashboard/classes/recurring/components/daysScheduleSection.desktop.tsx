"use client";

import { Box, FormHelperText } from "@mui/material";
import type { FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { labelSx } from "@/frontend/common/components/ui/form";
import type { RecurringClassFormData } from "@/frontend/common/views/dashboard/classes/recurring/recurringClassSchema";
import { DayScheduleRowDesktop } from "@/frontend/desktop/views/dashboard/classes/recurring/components/dayScheduleRow.desktop";
import type { CreateRecurringClassLabels } from "@/shared/locale";

interface DaysScheduleSectionDesktopProps {
  readonly watch: UseFormWatch<RecurringClassFormData>;
  readonly setValue: UseFormSetValue<RecurringClassFormData>;
  readonly errors: FieldErrors<RecurringClassFormData>;
  readonly labels: Pick<
    CreateRecurringClassLabels,
    "daysSelection" | "classSchedule" | "weekendOff" | "timeOverride" | "days"
  >;
}

const DAY_LABEL_KEY_MAP: Record<string, keyof CreateRecurringClassLabels["days"]> = {
  MONDAY: "monday",
  TUESDAY: "tuesday",
  WEDNESDAY: "wednesday",
  THURSDAY: "thursday",
  FRIDAY: "friday",
  SATURDAY: "saturday",
  SUNDAY: "sunday",
};

export function DaysScheduleSectionDesktop({ watch, setValue, errors, labels }: DaysScheduleSectionDesktopProps) {
  const days = watch("days");

  const handleToggleDay = (index: number, enabled: boolean) => {
    setValue(`days.${index}.enabled`, enabled, { shouldValidate: true });
    if (!enabled) {
      setValue(`days.${index}.showOverride`, false, { shouldValidate: true });
    }
  };

  const handleToggleOverride = (index: number) => {
    const current = days[index];
    if (!current.enabled || current.isWeekend) return;
    setValue(`days.${index}.showOverride`, !current.showOverride, { shouldValidate: true });
  };

  const handleTimeOverrideChange = (index: number, time: string) => {
    setValue(`days.${index}.timeOverride`, time, { shouldValidate: true });
  };

  return (
    <Box>
      <Box component="label" sx={labelSx}>
        {labels.daysSelection}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {days.map((day, index) => {
          const labelKey = DAY_LABEL_KEY_MAP[day.day];
          return (
            <DayScheduleRowDesktop
              key={day.day}
              day={day}
              index={index}
              dayLabel={labelKey ? labels.days[labelKey] : day.day}
              weekendOffLabel={labels.weekendOff}
              timeOverrideLabel={labels.timeOverride}
              onToggleDay={handleToggleDay}
              onToggleOverride={handleToggleOverride}
              onTimeOverrideChange={handleTimeOverrideChange}
            />
          );
        })}
      </Box>
      {errors.days && (
        <FormHelperText error sx={{ mt: 1 }}>
          {errors.days.message ?? errors.days.root?.message}
        </FormHelperText>
      )}
    </Box>
  );
}
