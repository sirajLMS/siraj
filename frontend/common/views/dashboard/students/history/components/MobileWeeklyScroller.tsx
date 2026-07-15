import { Box, Typography } from "@mui/material";
import { useMemo } from "react";
import { AttendanceStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { ClassSession, MobileWeeklyScrollerProps } from "@/frontend/common/views/dashboard/students/history/types";
import { useAppTranslation } from "@/shared/locale/client";

interface WeekDayData {
  dayKey: string;
  dayOfMonth: number;
  displayDate: number;
  hasSession: boolean;
  isInMonth: boolean;
  status: AttendanceStatus | null;
}

function computeWeekDays(
  currentMonth: Date,
  selectedWeek: number,
  classes: Readonly<Partial<Record<number, ClassSession>>>
): WeekDayData[] {
  const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();

  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const weekStartDay = (selectedWeek - 1) * 7 + 1 - firstDayOfMonth;

  const result: WeekDayData[] = [];
  const weekDayIndices = [1, 2, 3, 4, 5, 6, 0];

  for (let i = 0; i < 7; i++) {
    const dayAbs = weekStartDay + i;
    if (dayAbs < 1 || dayAbs > daysInMonth) {
      const displayDate =
        dayAbs < 1
          ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate() + dayAbs
          : dayAbs - daysInMonth;
      result.push({
        dayKey: dayKeys[weekDayIndices[i]],
        dayOfMonth: -1,
        displayDate,
        hasSession: false,
        isInMonth: false,
        status: null,
      });
      continue;
    }

    const session = classes[dayAbs];
    result.push({
      dayKey: dayKeys[weekDayIndices[i]],
      dayOfMonth: dayAbs,
      displayDate: dayAbs,
      hasSession: !!session,
      isInMonth: true,
      status: session?.status ?? null,
    });
  }

  return result;
}

export function MobileWeeklyScroller({
  selectedWeek,
  selectedDay,
  currentMonth,
  classes,
  onSelectWeek,
  onSelectDay,
}: Readonly<MobileWeeklyScrollerProps>) {
  const t = useAppTranslation("dashboard.studentHistory.calendar");

  const weekDays = useMemo(
    () => computeWeekDays(currentMonth, selectedWeek, classes),
    [currentMonth, selectedWeek, classes]
  );

  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.surfaceContainerLowest,
        borderRadius: "xl",
        boxShadow: theme.palette.shadow.card,
        border: `1px solid ${theme.palette.border.light}`,
        p: 2,
        mb: 3,
      })}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onSurface })}>
          {t.weeklyAttendance}
        </Typography>
        <Typography variant="labelMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
          {t.week({ number: selectedWeek })}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          overflowX: "auto",
          gap: 1,
          msOverflowStyle: "none",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {weekDays.map(d => {
          const isSelected = d.isInMonth && d.dayOfMonth === selectedDay && d.hasSession;

          let dotColor: string | ((theme: import("@mui/material/styles").Theme) => string) = theme =>
            theme.palette.primary.main;
          if (isSelected) {
            dotColor = theme => theme.palette.onPrimaryContainer;
          } else if (d.status === AttendanceStatus.Absent) {
            dotColor = theme => theme.palette.error.main;
          } else if (d.status === AttendanceStatus.Late) {
            dotColor = theme => theme.palette.warning.main;
          }

          return (
            <Box
              key={d.dayKey}
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
                ...(isSelected && { outline: `1px solid ${theme.palette.primary.main}33` }),
                "&:hover": {
                  backgroundColor: isSelected ? theme.palette.primaryContainer : theme.palette.surfaceContainerLow,
                },
                opacity: d.hasSession ? 1 : 0.4,
                cursor: d.isInMonth ? "pointer" : "default",
              })}
              onClick={() => {
                if (d.isInMonth && d.hasSession) {
                  onSelectDay(d.dayOfMonth);
                }
                onSelectWeek(selectedWeek);
              }}
            >
              <Typography
                variant="labelMd"
                sx={theme => ({ color: isSelected ? "inherit" : theme.palette.onSurfaceVariant, mb: 0.5 })}
              >
                {t.days[d.dayKey as keyof typeof t.days]}
              </Typography>
              <Typography variant="titleLg">{d.displayDate}</Typography>
              {d.hasSession && (
                <Box
                  sx={theme => ({
                    width: 6,
                    height: 6,
                    borderRadius: "full",
                    backgroundColor: typeof dotColor === "function" ? dotColor(theme) : dotColor,
                    mt: 0.5,
                  })}
                />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
