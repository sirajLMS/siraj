"use client";

import { Box, Typography } from "@mui/material";
import type { ReportsSummary } from "@/frontend/stores/mockReportsStore";

interface ReportsTotalsRowProps {
  readonly summary: ReportsSummary;
  readonly totalsLabel: string;
}

function formatCurrency(value: number): string {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ReportsTotalsRow({ summary, totalsLabel }: Readonly<ReportsTotalsRowProps>) {
  const totalsText = `${formatCurrency(summary.totalEgp)} EGP, ${formatCurrency(summary.totalUsd)} $`;

  return (
    <Box
      sx={theme => ({
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.4fr) repeat(4, 90px) 100px 130px 130px",
        alignItems: "center",
        px: 3,
        py: 2.5,
        bgcolor: theme.palette.surfaceContainer,
        borderTop: `2px solid ${theme.palette.primary.main}`,
        gap: 1,
      })}
    >
      <Typography variant="titleLg" sx={{ color: theme => theme.palette.primary.main, textAlign: "end", pr: 2 }}>
        {totalsLabel}
      </Typography>
      <Box sx={{ gridColumn: "span 4" }} />
      <Typography variant="titleLg" sx={{ color: theme => theme.palette.primary.main, textAlign: "center" }}>
        {summary.totalHours}
      </Typography>
      <Typography
        variant="titleLg"
        sx={{ color: theme => theme.palette.primary.main, textAlign: "end", gridColumn: "span 2" }}
      >
        {totalsText}
      </Typography>
    </Box>
  );
}
