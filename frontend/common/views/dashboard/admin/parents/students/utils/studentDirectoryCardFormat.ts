// NEW FOR PLAN v5 (newly created for the migration wave)

import type { Theme } from "@mui/material/styles";

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
