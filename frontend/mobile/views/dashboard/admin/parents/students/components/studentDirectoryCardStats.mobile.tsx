"use client";

import { Box, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type {
  StudentDirectoryRowExtended,
  StudentEnrollmentStatus,
} from "@/frontend/common/views/dashboard/admin/parents/students/types";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui";

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
  ...theme.typography.labelSm,
  letterSpacing: "0.06em",
  color: theme.palette.text.secondary,
  mb: 0.5,
});

const valueSx = (theme: Theme) => ({
  ...theme.typography.bodyMd,
  fontWeight: 700,
  color: theme.palette.primary.main,
});

export function StudentDirectoryCardStats({
  row,
  weeklyHoursLabel,
  enrollmentStatusLabel,
  enrollmentLabels,
}: Readonly<StudentDirectoryCardStatsProps>) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
      <Box>
        <Typography sx={labelSx}>{weeklyHoursLabel}</Typography>
        <Typography sx={valueSx}>{formatHours(row.hoursPerWeek ?? 0)}</Typography>
      </Box>
      <Box>
        <Typography sx={labelSx}>{enrollmentStatusLabel}</Typography>
        <MobileStatusBadge
          category="enrollment"
          status={row.enrollmentStatus}
          label={enrollmentLabels[row.enrollmentStatus]}
        />
      </Box>
    </Box>
  );
}
