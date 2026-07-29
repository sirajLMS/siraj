"use client";

import { Box, Typography } from "@mui/material";
import { useMemo } from "react";
import type { StudentHistorySessionRow } from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";
import { MobileHorizontalScrollRow } from "@/frontend/mobile/components/ui/container";
import type { StudentPortalHistoryCalendarWeekdayLabels } from "@/shared/locale/types/dashboard/studentPortal/studentHistory";

interface WeekDayData {
  readonly dayKey: string;
  readonly dayOfMonth: number;
  readonly displayDate: number;
  readonly hasSession: boolean;
  readonly isInMonth: boolean;
}

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function weekdayLabelsFromLocale(calendarWeekdays: StudentPortalHistoryCalendarWeekdayLabels): readonly string[] {
  return WEEKDAY_KEYS.map(key => calendarWeekdays[key]);
}

function computeWeekDays(
  currentMonth: Date,
  selectedWeek: number,
  sessionsByDay: Readonly<Partial<Record<number, StudentHistorySessionRow>>>,
  dayKeys: readonly string[]
): WeekDayData[] {
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
        dayKey: dayKeys[i] ?? "",
        dayOfMonth: -1,
        displayDate,
        hasSession: false,
        isInMonth: false,
      });
      continue;
    }
    result.push({
      dayKey: dayKeys[i] ?? "",
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
  readonly calendarWeekdays: StudentPortalHistoryCalendarWeekdayLabels;
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
  calendarWeekdays,
  onSelectWeek,
  onSelectDay,
}: Readonly<HistoryWeeklyScrollerProps>) {
  const dayKeys = useMemo(() => weekdayLabelsFromLocale(calendarWeekdays), [calendarWeekdays]);

  const weekDays = useMemo(
    () => computeWeekDays(currentMonth, selectedWeek, sessionsByDay, dayKeys),
    [currentMonth, selectedWeek, sessionsByDay, dayKeys]
  );

  const maxWeek = 6;

  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.surfaceContainerLowest,
        borderRadius: 0,
        boxShadow: theme.palette.shadow.card,
        border: `1px solid ${theme.palette.outlineVariant}`,
        py: 2,
        px: 2,
      })}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, gap: 1 }}>
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onSurface })}>
          {weeklyAttendanceLabel}
        </Typography>
        <Box sx={{ display: "flex", gap: 0.75, flexShrink: 0 }}>
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
                minWidth: 32,
                px: 1.25,
                py: 0.5,
                borderRadius: 999,
                cursor: "pointer",
                textAlign: "center",
                backgroundColor: selectedWeek === week ? theme.palette.primary.main : "transparent",
                color: selectedWeek === week ? theme.palette.onPrimary : theme.palette.primary.main,
                typography: "labelMd",
                fontWeight: 700,
                border: `1px solid ${selectedWeek === week ? theme.palette.primary.main : theme.palette.outlineVariant}`,
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

      <MobileHorizontalScrollRow leadSpacing={0} sx={theme => ({ gap: theme.spacing(1.25), paddingBottom: 0 })}>
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
                  flex: "0 0 auto",
                  minWidth: 52,
                  py: 1.5,
                  px: 1,
                  borderRadius: 999,
                  textAlign: "center",
                  opacity: day.isInMonth ? 1 : 0.4,
                  cursor: day.isInMonth ? "pointer" : "default",
                  backgroundColor,
                  border: `1px solid ${isSelected ? theme.palette.primary.main : theme.palette.outlineVariant}`,
                  scrollSnapAlign: "start",
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
      </MobileHorizontalScrollRow>
    </Box>
  );
}
