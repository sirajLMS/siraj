"use client";

import { Box, FormHelperText } from "@mui/material";
import { resolveDayLabelKey } from "@/frontend/common/views/dashboard/classes/recurring/constants";
import type { DaysScheduleSectionProps } from "@/frontend/common/views/dashboard/classes/recurring/types";
import { DayScheduleRowDesktop } from "@/frontend/desktop/views/dashboard/classes/recurring/components/dayScheduleRow.desktop";

export function DaysScheduleSectionDesktop({ watch, setValue, errors, labels }: DaysScheduleSectionProps) {
  const days = watch("days");

  const handleToggleDay = (index: number, enabled: boolean) => {
    setValue(`days.${index}.enabled`, enabled, { shouldValidate: true });
    if (!enabled) {
      setValue(`days.${index}.showOverride`, false, { shouldValidate: true });
    }
  };

  const handleToggleOverride = (index: number) => {
    const current = days[index];
    if (!current.enabled) return;
    setValue(`days.${index}.showOverride`, !current.showOverride, { shouldValidate: true });
  };

  const handleTimeOverrideChange = (index: number, time: string) => {
    setValue(`days.${index}.timeOverride`, time, { shouldValidate: true });
  };

  return (
    <Box>
      <Box component="label" sx={{ typography: "labelLg", color: theme => theme.palette.onSurfaceVariant, mb: 1 }}>
        {labels.classSchedule}
      </Box>
      <Box sx={{ mb: 1, display: "flex", alignItems: "center", typography: "labelLg" }}>{labels.daysSelection}</Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {days.map((day, index) => {
          const labelKey = resolveDayLabelKey(day.day);
          const dayLabel = labelKey ? labels.days[labelKey] : day.day;
          return (
            <DayScheduleRowDesktop
              key={day.day}
              day={day}
              index={index}
              dayLabel={dayLabel}
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
