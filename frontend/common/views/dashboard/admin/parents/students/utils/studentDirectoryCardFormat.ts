// NEW FOR PLAN v5 (newly created for the migration wave)

import type { Theme } from "@mui/material/styles";
import {
  StudentEnrollmentStatus as EnrollmentEnum,
  type StudentEnrollmentStatus,
} from "@/frontend/common/views/dashboard/admin/parents/students/types";

export function formatHours(hours: number): string {
  if (hours === 0) return "0 hrs";
  return `${hours.toFixed(1)} hrs`;
}

export const labelSx = (theme: Theme) => ({
  ...theme.typography.labelSm,
  letterSpacing: "0.06em",
  color: theme.palette.text.secondary,
  mb: 0.5,
});

export const valueSx = (theme: Theme) => ({
  ...theme.typography.bodyMd,
  fontWeight: 700,
  color: theme.palette.primary.main,
});

export const labelBgColor = (status: StudentEnrollmentStatus, theme: Theme) => {
  switch (status) {
    case EnrollmentEnum.REGULAR:
      return theme.palette.status.active;
    case EnrollmentEnum.PROSPECT:
      return theme.palette.status.pending;
    default:
      return theme.palette.status.cancelled;
  }
};
