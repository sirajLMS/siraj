import { Box, Paper, Typography } from "@mui/material";
import type { ReactNode } from "react";

const TOTAL_GRID_CELLS = 35;
const DAYS_OF_WEEK = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export interface CalendarGridLayout {
  readonly daysInMonth: number;
  readonly emptyStartDays: readonly number[];
  readonly emptyEndDays: readonly number[];
}

export function computeCalendarGridLayout(currentMonth: Date): CalendarGridLayout {
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const emptyStartDays = Array.from({ length: firstDayOfMonth }, (_, i) => {
    const prevMonthDays = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate();
    return prevMonthDays - firstDayOfMonth + i + 1;
  });

  const remainingCells = TOTAL_GRID_CELLS - (emptyStartDays.length + daysInMonth);
  const emptyEndDays = Array.from(
    { length: remainingCells > 0 ? remainingCells : remainingCells + 7 },
    (_, i) => i + 1
  );

  return { daysInMonth, emptyStartDays, emptyEndDays };
}

export interface CalendarWeekdayHeaderProps {
  readonly translateDay: (day: string) => string;
}

export function CalendarWeekdayHeader({ translateDay }: Readonly<CalendarWeekdayHeaderProps>) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        borderBottom: theme => `1px solid ${theme.palette.border.light}`,
        backgroundColor: theme => theme.palette.surfaceContainerLow,
      }}
    >
      {DAYS_OF_WEEK.map(day => (
        <Box key={day} sx={{ py: 2, textAlign: "center" }}>
          <Typography variant="buttonText" sx={{ color: theme => theme.palette.onSecondaryContainer }}>
            {translateDay(day)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export function CalendarGridContainer({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: theme => theme.layout.radius.card,
        border: theme => `1px solid ${theme.palette.border.light}`,
        overflow: "hidden",
      }}
    >
      {children}
    </Paper>
  );
}
