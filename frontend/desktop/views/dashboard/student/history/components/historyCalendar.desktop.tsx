"use client";

import { Box } from "@mui/material";
import { computeCalendarGridLayout } from "@/frontend/common/views/dashboard/shared/calendarGridShared.utils";
import type { StudentHistorySessionRow } from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";
import type { StudentHistoryViewModel } from "@/frontend/common/views/dashboard/student/history/useStudentHistoryViewModel";
import {
  CalendarDayCell,
  CalendarSpilloverDay,
  CalendarWeekdayHeader,
} from "@/frontend/desktop/views/dashboard/student/history/components/historyCalendar.parts";

export interface StudentPortalHistoryCalendarProps {
  readonly currentMonth: Date;
  readonly sessionsByDay: Readonly<Partial<Record<number, StudentHistorySessionRow>>>;
  readonly selectedDay: number | null;
  readonly onSelectDay: (day: number | null) => void;
  readonly weekdayLabels: readonly string[];
  readonly labels: StudentHistoryViewModel["labels"];
  readonly locale: string;
}

export function StudentPortalHistoryCalendar({
  currentMonth,
  sessionsByDay,
  selectedDay,
  onSelectDay,
  weekdayLabels,
  labels,
  locale,
}: Readonly<StudentPortalHistoryCalendarProps>) {
  const { daysInMonth, emptyStartDays, emptyEndDays } = computeCalendarGridLayout(currentMonth);

  return (
    <Box
      sx={theme => ({
        borderRadius: 0,
        border: `1px solid ${theme.palette.outlineVariant}`,
        overflow: "hidden",
        backgroundColor: theme.palette.surfaceContainerLowest,
      })}
    >
      <CalendarWeekdayHeader weekdayLabels={weekdayLabels} />
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
        {emptyStartDays.map(day => (
          <CalendarSpilloverDay key={`prev-${day}`} day={day} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
          <CalendarDayCell
            key={`day-${day}`}
            day={day}
            session={sessionsByDay[day]}
            isSelected={selectedDay === day}
            onSelectDay={onSelectDay}
            labels={labels}
            locale={locale}
          />
        ))}
        {emptyEndDays.map(day => (
          <CalendarSpilloverDay key={`next-${day}`} day={day} />
        ))}
      </Box>
    </Box>
  );
}
