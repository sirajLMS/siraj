"use client";

import { Box } from "@mui/material";
import { WEEKLY_SCHEDULE_TIMES } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks";
import type { MobileScheduleListProps } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import { DaySelector } from "@/frontend/mobile/views/dashboard/teachers/schedule/weekly/mobileScheduleList.mobile.daySelector";
import { TimeSlotRow } from "@/frontend/mobile/views/dashboard/teachers/schedule/weekly/mobileScheduleList.mobile.timeSlotRow";

export default function MobileScheduleList({
  classes,
  onRemoveClass,
  hasScheduleDeleteClass,
  labels,
  meetingJoinLabels,
  selectedDay,
  onSelectDay,
}: Readonly<MobileScheduleListProps>) {
  const getClassesForSlot = (day: string, time: string) => {
    return classes.filter(c => c.day?.toLowerCase() === day && c.startTime === time);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <DaySelector selectedDay={selectedDay} onSelect={onSelectDay} labels={labels} />

      <Box
        sx={theme => ({
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          mt: 2,
          backgroundColor: theme.palette.border.light,
          borderRadius: theme.layout.radius.card,
          overflow: "hidden",
          border: `1px solid ${theme.palette.border.light}`,
        })}
      >
        {WEEKLY_SCHEDULE_TIMES.map(time => (
          <TimeSlotRow
            key={time}
            time={time}
            slotClasses={getClassesForSlot(selectedDay, time)}
            onRemoveClass={onRemoveClass}
            hasScheduleDeleteClass={hasScheduleDeleteClass}
            labels={labels}
            meetingJoinLabels={meetingJoinLabels}
          />
        ))}
      </Box>
    </Box>
  );
}
