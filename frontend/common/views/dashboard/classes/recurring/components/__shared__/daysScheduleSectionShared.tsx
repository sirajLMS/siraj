"use client";

import { Box, FormHelperText } from "@mui/material";
import type { ComponentType } from "react";
import { resolveDayLabelKey } from "@/frontend/common/views/dashboard/classes/recurring/constants";
import type {
  DayScheduleRowProps,
  DaysScheduleSectionProps,
} from "@/frontend/common/views/dashboard/classes/recurring/types";

export function DaysScheduleSectionShared({
  watch,
  setValue,
  errors,
  labels,
  DayScheduleRow,
}: DaysScheduleSectionProps & {
  readonly DayScheduleRow: ComponentType<DayScheduleRowProps>;
}) {
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
      <Box component="label" sx={{ typography: "labelMd", color: theme => theme.palette.onSurfaceVariant, mb: 1 }}>
        {labels.classSchedule}
      </Box>
      <Box sx={{ mb: 1, display: "flex", alignItems: "center", typography: "labelMd" }}>{labels.daysSelection}</Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {days.map((day, index) => {
          const labelKey = resolveDayLabelKey(day.day);
          const dayLabel = labelKey ? labels.days[labelKey] : day.day;
          return (
            <DayScheduleRow
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
