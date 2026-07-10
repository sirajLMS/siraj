"use client";

import { Box, Typography } from "@mui/material";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import type { ReportsSummary } from "@/frontend/views/dashboard/reports/types/reportsTypes";

interface ReportsTotalsRowProps {
  readonly summary: ReportsSummary;
  readonly totalsLabel: string;
}

function formatCurrencyAmount(value: number): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ReportsTotalsRow({ summary, totalsLabel }: Readonly<ReportsTotalsRowProps>) {
  const { hasPermission } = useUserStore();
  const showFinancials = hasPermission(AppPermission.ReportViewFinancials);

  const totalsText =
    summary.currencyDistribution.length > 0
      ? summary.currencyDistribution.map(slice => `${formatCurrencyAmount(slice.amount)} ${slice.currency}`).join(", ")
      : "—";

  return (
    <Box
      sx={theme => ({
        display: "grid",
        gridTemplateColumns: showFinancials
          ? "minmax(0, 1.4fr) repeat(4, 90px) 100px minmax(180px, 1fr)"
          : "minmax(0, 1.4fr) repeat(4, 90px)",
        alignItems: "center",
        px: 3,
        py: 2.5,
        backgroundColor: theme.palette.surfaceContainer,
        borderTop: `2px solid ${theme.palette.primary.main}`,
        gap: 1,
      })}
    >
      <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, pr: 2, textAlign: "end" })}>
        {totalsLabel}
      </Typography>
      <Box sx={{ gridColumn: "span 4" }} />
      {showFinancials && (
        <>
          <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, textAlign: "center" })}>
            {summary.totalHours}
          </Typography>
          <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, textAlign: "end" })}>
            {totalsText}
          </Typography>
        </>
      )}
    </Box>
  );
}
