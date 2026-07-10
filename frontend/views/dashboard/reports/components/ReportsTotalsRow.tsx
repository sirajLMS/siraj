"use client";

import { Box, Typography } from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import type { ReportLedgerRow, ReportsSummary } from "@/frontend/views/dashboard/reports/types/reportsTypes";
import {
  aggregatePaidAmountTotals,
  formatReportPaidAmounts,
} from "@/frontend/views/dashboard/reports/utils/formatReportPaidAmounts";

interface ReportsTotalsRowProps {
  readonly summary: ReportsSummary;
  readonly rows: readonly ReportLedgerRow[];
  readonly totalsLabel: string;
}

export function ReportsTotalsRow({ summary, rows, totalsLabel }: Readonly<ReportsTotalsRowProps>) {
  const { hasPermission } = useUserStore();
  const locale = useLocale();
  const tProfile = useTranslations("profile");
  const tErrors = useTranslations("errors");
  const showFinancials = hasPermission(AppPermission.ReportViewFinancials);

  const totalsText = useMemo(() => {
    const paidTotals = aggregatePaidAmountTotals(rows);
    return formatReportPaidAmounts(paidTotals, locale, {
      convertedAmount: values => tProfile("convertedAmount", values),
      displayCurrencyFallback: values => tErrors("displayCurrencyFallback", values),
    });
  }, [rows, locale, tProfile, tErrors]);

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
