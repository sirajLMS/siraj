"use client";

import { Typography } from "@mui/material";

type ReportsCountCellTone = "default" | "error" | "primary";

interface ReportsCountCellProps {
  readonly value: number;
  readonly tone?: ReportsCountCellTone;
}

export function ReportsCountCell({ value, tone = "default" }: Readonly<ReportsCountCellProps>) {
  return (
    <Typography
      variant="bodyMd"
      sx={theme => {
        if (tone === "error") {
          return { color: theme.palette.error.main, fontWeight: 600, textAlign: "center", width: "100%" };
        }
        if (tone === "primary") {
          return { color: theme.palette.primary.main, fontWeight: 600, textAlign: "center", width: "100%" };
        }
        return { color: theme.palette.text.secondary, textAlign: "center", width: "100%" };
      }}
    >
      {value}
    </Typography>
  );
}

interface ReportsHoursCellProps {
  readonly value: string;
}

export function ReportsHoursCell({ value }: Readonly<ReportsHoursCellProps>) {
  return (
    <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
      {value}
    </Typography>
  );
}

interface ReportsPaidAmountsCellProps {
  readonly text: string;
}

export function ReportsPaidAmountsCell({ text }: Readonly<ReportsPaidAmountsCellProps>) {
  return (
    <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 600 })}>
      {text}
    </Typography>
  );
}
