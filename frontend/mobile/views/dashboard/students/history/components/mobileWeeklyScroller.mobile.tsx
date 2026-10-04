"use client";

import { Box, Typography } from "@mui/material";
import { useMemo } from "react";
import type { MobileWeeklyScrollerProps } from "@/frontend/common/views/dashboard/students/history/types";
import { useStudentHistoryLabels } from "@/frontend/common/views/dashboard/students/history/useStudentHistoryLabels";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui";
import { computeWeekDays } from "@/frontend/mobile/views/dashboard/students/history/components/mobileWeeklyScroller.mobile.helpers";
import { WeekDayCell } from "@/frontend/mobile/views/dashboard/students/history/components/mobileWeeklyScroller.mobile.parts";

export function MobileWeeklyScroller({
  selectedWeek,
  selectedDay,
  currentMonth,
  classes,
  onSelectWeek,
  onSelectDay,
}: Readonly<MobileWeeklyScrollerProps>) {
  const t = useStudentHistoryLabels().calendar;

  const weekDays = useMemo(
    () => computeWeekDays(currentMonth, selectedWeek, classes),
    [currentMonth, selectedWeek, classes]
  );

  return (
    <MobileSectionPanel
      sx={{ mb: 3 }}
      contentInset={false}
      title={
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onSurface })}>
            {t.weeklyAttendance}
          </Typography>
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
            {t.week(selectedWeek)}
          </Typography>
        </Box>
      }
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          overflowX: "auto",
          gap: 1,
          paddingInline: theme => theme.spacing(2),
          py: 2,
          msOverflowStyle: "none",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {weekDays.map(day => (
          <WeekDayCell
            key={day.dayKey}
            day={day}
            selectedWeek={selectedWeek}
            selectedDay={selectedDay}
            labels={t.days}
            onSelectWeek={onSelectWeek}
            onSelectDay={onSelectDay}
          />
        ))}
      </Box>
    </MobileSectionPanel>
  );
}
