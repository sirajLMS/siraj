import { Box, Paper, Typography } from "@mui/material";
import type * as React from "react";

const DAYS_OF_WEEK = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export interface CalendarWeekdayHeaderProps {
  readonly translateDay: (day: string) => string;
}

export function CalendarWeekdayHeader({ translateDay }: Readonly<CalendarWeekdayHeaderProps>): React.ReactNode {
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

export function CalendarGridContainer({ children }: Readonly<{ children: React.ReactNode }>): React.ReactNode {
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
