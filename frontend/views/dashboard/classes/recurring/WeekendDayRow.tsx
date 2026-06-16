"use client";

import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material";

interface WeekendDayRowProps {
  readonly dayLabel: string;
  readonly weekendOffLabel: string;
}

export function WeekendDayRow({ dayLabel, weekendOffLabel }: WeekendDayRowProps) {
  return (
    <Box
      sx={theme => ({
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        p: 2,
        borderRadius: 3,
        bgcolor: theme.palette.surfaceContainer,
        opacity: 0.6,
        border: 1,
        borderColor: theme.palette.outlineVariant,
      })}
    >
      <FormControlLabel
        control={<Checkbox checked={false} disabled />}
        label={
          <Typography sx={theme => ({ fontWeight: 600, color: theme.palette.onSurfaceVariant })}>{dayLabel}</Typography>
        }
      />
      <Typography
        sx={theme => ({
          fontSize: "12px",
          fontWeight: 700,
          color: theme.palette.onSurfaceVariant,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          fontStyle: "italic",
          px: 1,
        })}
      >
        {weekendOffLabel}
      </Typography>
    </Box>
  );
}
