"use client";

import { Box, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { StudentDirectoryRowExtended, StudentEnrollmentStatus } from "../types";

interface StudentDirectoryCardStatsProps {
  readonly row: StudentDirectoryRowExtended;
  readonly weeklyHoursLabel: string;
  readonly enrollmentStatusLabel: string;
  readonly enrollmentLabels: Record<StudentEnrollmentStatus, string>;
}

function formatHours(hours: number): string {
  if (hours === 0) return "0 hrs";
  return `${hours.toFixed(1)} hrs`;
}

const labelSx = (theme: Theme) => ({
  ...theme.typography.labelUppercase,
  fontSize: "10px",
  letterSpacing: "0.06em",
  color: theme.palette.text.secondary,
  mb: 0.5,
});

const valueSx = (theme: Theme) => ({
  ...theme.typography.bodyMd,
  fontWeight: 700,
  color: theme.palette.primary.main,
});

const labelBgColor = (status: StudentEnrollmentStatus, theme: Theme) => {
  switch (status) {
    case "regular":
      return theme.palette.status.active;
    case "prospect":
      return theme.palette.status.pending;
    default:
      return theme.palette.status.cancelled;
  }
};

export function StudentDirectoryCardStats({
  row,
  weeklyHoursLabel,
  enrollmentStatusLabel,
  enrollmentLabels,
}: StudentDirectoryCardStatsProps) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
      <Box>
        <Typography sx={labelSx}>{weeklyHoursLabel}</Typography>
        <Typography sx={valueSx}>{formatHours(row.hoursPerWeek)}</Typography>
      </Box>
      <Box>
        <Typography sx={labelSx}>{enrollmentStatusLabel}</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box
            sx={theme => ({
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: labelBgColor(row.enrollmentStatus, theme),
            })}
          />
          <Typography
            sx={theme => ({
              ...theme.typography.bodyMd,
              fontWeight: 500,
              color: theme.palette.text.primary,
            })}
          >
            {enrollmentLabels[row.enrollmentStatus]}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
