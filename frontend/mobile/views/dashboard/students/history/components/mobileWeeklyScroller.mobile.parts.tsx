"use client";

import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  type DotColorResolver,
  isCalendarDayKey,
  resolveDotColor,
  type WeekDayData,
} from "@/frontend/mobile/views/dashboard/students/history/components/mobileWeeklyScroller.mobile.helpers";
import type { StudentHistoryLabels } from "@/shared/locale/types/dashboard/students/history";

interface WeekDayCellProps {
  readonly day: WeekDayData;
  readonly selectedWeek: number;
  readonly selectedDay: number | null;
  readonly labels: StudentHistoryLabels["calendar"]["days"];
  readonly onSelectWeek: (week: number) => void;
  readonly onSelectDay: (dayOfMonth: number) => void;
}

function WeekDayCell({
  day,
  selectedWeek,
  selectedDay,
  labels,
  onSelectWeek,
  onSelectDay,
}: Readonly<WeekDayCellProps>) {
  const isSelected = day.isInMonth && day.dayOfMonth === selectedDay && day.hasSession;
  const dotColor: DotColorResolver = resolveDotColor(isSelected, day.status);

  return (
    <Box
      sx={theme => ({
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minWidth: 48,
        py: 1.5,
        borderRadius: "xl",
        backgroundColor: isSelected ? theme.palette.primaryContainer : "transparent",
        color: isSelected ? theme.palette.onPrimaryContainer : "inherit",
        boxShadow: isSelected ? theme.palette.shadow.cardHover : "none",
        ...(isSelected && { outline: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }),
        "&:hover": {
          backgroundColor: isSelected ? theme.palette.primaryContainer : theme.palette.surfaceContainerLow,
        },
        opacity: day.hasSession ? 1 : 0.4,
        cursor: day.isInMonth ? "pointer" : "default",
      })}
      onClick={() => {
        if (day.isInMonth && day.hasSession) {
          onSelectDay(day.dayOfMonth);
        }
        onSelectWeek(selectedWeek);
      }}
    >
      <Typography
        variant="labelMd"
        sx={theme => ({ color: isSelected ? "inherit" : theme.palette.onSurfaceVariant, mb: 0.5 })}
      >
        {isCalendarDayKey(day.dayKey) ? labels[day.dayKey] : day.dayKey}
      </Typography>
      <Typography variant="titleLg">{day.displayDate}</Typography>
      {day.hasSession && (
        <Box
          sx={theme => ({
            width: 6,
            height: 6,
            borderRadius: "full",
            backgroundColor: dotColor(theme),
            mt: 0.5,
          })}
        />
      )}
    </Box>
  );
}

export { WeekDayCell };
