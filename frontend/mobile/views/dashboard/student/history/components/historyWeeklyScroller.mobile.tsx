"use client";

import { Box, Typography } from "@mui/material";
import { useMemo } from "react";
import type { StudentHistorySessionRow } from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";

interface WeekDayData {
  readonly dayKey: string;
  readonly dayOfMonth: number;
  readonly displayDate: number;
  readonly hasSession: boolean;
  readonly isInMonth: boolean;
}

function computeWeekDays(
  currentMonth: Date,
  selectedWeek: number,
  sessionsByDay: Readonly<Partial<Record<number, StudentHistorySessionRow>>>
): WeekDayData[] {
  const dayKeys = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const weekStartDay = (selectedWeek - 1) * 7 + 1 - firstDayOfMonth;

  const result: WeekDayData[] = [];
  for (let i = 0; i < 7; i++) {
    const dayAbs = weekStartDay + i;
    if (dayAbs < 1 || dayAbs > daysInMonth) {
      const displayDate =
        dayAbs < 1
          ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate() + dayAbs
          : dayAbs - daysInMonth;
      result.push({
        dayKey: dayKeys[i],
        dayOfMonth: -1,
        displayDate,
        hasSession: false,
        isInMonth: false,
      });
      continue;
    }
    result.push({
      dayKey: dayKeys[i],
      dayOfMonth: dayAbs,
      displayDate: dayAbs,
      hasSession: Boolean(sessionsByDay[dayAbs]),
      isInMonth: true,
    });
  }
  return result;
}

export interface HistoryWeeklyScrollerProps {
  readonly selectedWeek: number;
  readonly selectedDay: number | null;
  readonly currentMonth: Date;
  readonly sessionsByDay: Readonly<Partial<Record<number, StudentHistorySessionRow>>>;
  readonly weeklyAttendanceLabel: string;
  readonly weekLabel: string;
  readonly onSelectWeek: (week: number) => void;
  readonly onSelectDay: (day: number | null) => void;
}

export function HistoryWeeklyScrollerMobile({
  selectedWeek,
  selectedDay,
  currentMonth,
  sessionsByDay,
  weeklyAttendanceLabel,
  weekLabel,
  onSelectWeek,
  onSelectDay,
}: Readonly<HistoryWeeklyScrollerProps>) {
  const weekDays = useMemo(
    () => computeWeekDays(currentMonth, selectedWeek, sessionsByDay),
    [currentMonth, selectedWeek, sessionsByDay]
  );

  const maxWeek = 6;

  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.surfaceContainerLowest,
        borderRadius: 2,
        boxShadow: theme.palette.shadow.card,
        border: `1px solid ${theme.palette.outlineVariant}`,
        p: 2,
      })}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onSurface })}>
          {weeklyAttendanceLabel}
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {Array.from({ length: maxWeek }, (_, i) => i + 1).map(week => (
            <Box
              key={week}
              role="button"
              tabIndex={0}
              onClick={() => onSelectWeek(week)}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectWeek(week);
                }
              }}
              sx={theme => ({
                px: 1,
                py: 0.25,
                borderRadius: 1,
                cursor: "pointer",
                backgroundColor: selectedWeek === week ? theme.palette.primary.main : "transparent",
                color: selectedWeek === week ? theme.palette.onPrimary : theme.palette.primary.main,
                typography: "labelMd",
                fontWeight: 700,
              })}
            >
              {week}
            </Box>
          ))}
        </Box>
      </Box>

      <Typography variant="labelMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700, mb: 1.5 })}>
        {weekLabel}
      </Typography>

      <Box sx={{ display: "flex", gap: 1, overflowX: "auto" }}>
        {weekDays.map(day => {
          const isSelected = day.isInMonth && selectedDay === day.dayOfMonth;
          return (
            <Box
              key={`${day.dayKey}-${day.displayDate}`}
              role="button"
              tabIndex={day.isInMonth ? 0 : -1}
              onClick={() => {
                if (!day.isInMonth) return;
                onSelectDay(isSelected ? null : day.dayOfMonth);
              }}
              onKeyDown={e => {
                if (!day.isInMonth) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectDay(isSelected ? null : day.dayOfMonth);
                }
              }}
              sx={theme => {
                let backgroundColor = theme.palette.surfaceContainer;
                if (isSelected) {
                  backgroundColor = theme.palette.primaryContainer;
                } else if (day.hasSession) {
                  backgroundColor = theme.palette.secondaryContainer;
                }
                return {
                  flex: "1 0 44px",
                  minWidth: 44,
                  py: 1.5,
                  borderRadius: 2,
                  textAlign: "center",
                  opacity: day.isInMonth ? 1 : 0.4,
                  cursor: day.isInMonth ? "pointer" : "default",
                  backgroundColor,
                  border: `1px solid ${isSelected ? theme.palette.primary.main : theme.palette.outlineVariant}`,
                };
              }}
            >
              <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {day.dayKey}
              </Typography>
              <Typography
                variant="titleLg"
                sx={theme => ({
                  fontWeight: 700,
                  color: isSelected ? theme.palette.onPrimaryContainer : theme.palette.onSurface,
                })}
              >
                {day.displayDate}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
