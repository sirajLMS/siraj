"use client";

import { Box, FormHelperText } from "@mui/material";
import type { FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { labelSx } from "@/frontend/common/components/ui/form";
import { DayScheduleRow } from "@/frontend/views/dashboard/classes/recurring/DayScheduleRow";
import type { RecurringClassFormData } from "@/frontend/views/dashboard/classes/recurring/recurringClassSchema";
import type { CreateRecurringClassLabels } from "@/shared/messages/types/message";

interface DaysScheduleSectionProps {
  readonly watch: UseFormWatch<RecurringClassFormData>;
  readonly setValue: UseFormSetValue<RecurringClassFormData>;
  readonly errors: FieldErrors<RecurringClassFormData>;
  readonly isMobile: boolean;
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

export function DaysScheduleSection({ watch, setValue, errors, isMobile, labels }: DaysScheduleSectionProps) {
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
        {isMobile ? labels.classSchedule : labels.daysSelection}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {days.map((day, index) => {
          const labelKey = DAY_LABEL_KEY_MAP[day.day];
          return (
            <DayScheduleRow
              key={day.day}
              day={day}
              index={index}
              isMobile={isMobile}
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
