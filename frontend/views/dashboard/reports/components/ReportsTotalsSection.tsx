"use client";

import { Box, Stack, Typography } from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { buildFxDisplayMessages } from "@/frontend/lib/buildFxDisplayMessages";
import { useUserStore } from "@/frontend/stores/userStore";
import type { ReportLedgerRow, ReportsSummary } from "@/frontend/views/dashboard/reports/types/reportsTypes";
import {
  aggregatePaidAmountTotals,
  formatReportPaidAmounts,
} from "@/frontend/views/dashboard/reports/utils/formatReportPaidAmounts";

interface ReportsTotalsSectionProps {
  readonly summary: ReportsSummary;
  readonly rows: readonly ReportLedgerRow[];
  readonly totalsLabel: string;
  readonly variant: "desktop" | "mobile";
}

function useTotalsText(rows: readonly ReportLedgerRow[]) {
  const locale = useLocale();
  const tProfile = useTranslations("profile");
  const tErrors = useTranslations("errors");

  return useMemo(() => {
    const paidTotals = aggregatePaidAmountTotals(rows);
    return formatReportPaidAmounts(paidTotals, locale, buildFxDisplayMessages(tProfile, tErrors));
  }, [rows, locale, tProfile, tErrors]);
}

export function ReportsTotalsSection({ summary, rows, totalsLabel, variant }: Readonly<ReportsTotalsSectionProps>) {
  const { hasPermission } = useUserStore();
  const showFinancials = hasPermission(AppPermission.ReportViewFinancials);
  const totalsText = useTotalsText(rows);

  if (variant === "mobile") {
    if (!showFinancials) {
      return null;
    }

    return (
      <Box
        sx={theme => ({
          px: 2,
          py: 2,
          mb: 2,
          borderRadius: 2,
          backgroundColor: theme.palette.surfaceContainer,
          border: `1px solid ${theme.palette.outlineVariant}`,
        })}
      >
        <Stack spacing={1}>
          <Typography variant="bodyLg" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
            {totalsLabel}
          </Typography>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
              {summary.totalHours}
            </Typography>
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.primary.main, textAlign: "end" })}>
              {totalsText}
            </Typography>
          </Stack>
        </Stack>
      </Box>
    );
  }

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
