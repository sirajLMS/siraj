"use client";

import { Box, Stack, Tooltip, Typography } from "@mui/material";
import { useMemo } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { buildFxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import {
  type BillingCurrencyBucket,
  formatBillingCurrencyTotals,
} from "@/frontend/common/lib/formatBillingCurrencyTotals";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { ReportLedgerRow, ReportsSummary } from "@/frontend/common/views/dashboard/reports/types/reportsTypes";
import { aggregatePaidAmountTotals } from "@/frontend/common/views/dashboard/reports/utils/formatReportPaidAmounts";
import { useAppTranslation } from "@/shared/locale";

interface ReportsTotalsSectionDesktopProps {
  readonly summary: ReportsSummary;
  readonly rows: readonly ReportLedgerRow[];
  readonly totalsLabel: string;
}

function useTotalsDisplay(rows: readonly ReportLedgerRow[]) {
  const locale = useAppLocale();
  const tProfile = useAppTranslation().profileTranslations.base;
  const tErrors = useAppTranslation().errorsTranslations;

  return useMemo(() => {
    const paidTotals = aggregatePaidAmountTotals(rows);
    if (paidTotals.length === 0) {
      return { primary: "—", ariaLabel: tProfile.notSet };
    }

    const buckets: BillingCurrencyBucket[] = paidTotals.map(paid => ({
      amount: paid.amount,
      currency: paid.currency,
      displayAmount: paid.displayAmount
        ? {
            amount: paid.displayAmount.amount,
            currency: paid.displayAmount.currency,
            stale: paid.displayAmount.stale,
          }
        : null,
    }));

    return formatBillingCurrencyTotals(
      buckets,
      locale,
      buildFxDisplayMessages(
        {
          convertedAmount: tProfile.convertedAmount,
        },
        tErrors,
        {
          convertedTotalApprox: tProfile.convertedTotalApprox,
        }
      )
    );
  }, [rows, locale, tProfile, tErrors]);
}

function TotalsAmount({ display }: { readonly display: { primary: string; breakdown?: string; ariaLabel?: string } }) {
  if (!display.breakdown) {
    return (
      <Typography
        variant="bodyMd"
        sx={theme => ({ color: theme.palette.primary.main, textAlign: "end" })}
        aria-label={display.ariaLabel}
      >
        {display.primary}
      </Typography>
    );
  }

  return (
    <Stack spacing={0.25} sx={{ alignItems: "flex-end", maxWidth: "100%" }}>
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.primary.main, textAlign: "end" })}>
        {display.primary}
      </Typography>
      <Tooltip title={display.breakdown} arrow>
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            textAlign: "end",
            maxWidth: 240,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {display.breakdown}
        </Typography>
      </Tooltip>
    </Stack>
  );
}

export function ReportsTotalsSectionDesktop({
  summary,
  rows,
  totalsLabel,
}: Readonly<ReportsTotalsSectionDesktopProps>) {
  const { hasPermission } = useUserStore();
  const showFinancials = hasPermission(AppPermission.ReportViewFinancials);
  const totalsDisplay = useTotalsDisplay(rows);

  return (
    <Box
      sx={theme => ({
        display: "grid",
        gridTemplateColumns: showFinancials
          ? "minmax(0, 1.4fr) repeat(4, 90px) 120px minmax(180px, 1fr)"
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
          <Box sx={{ textAlign: "end" }}>
            <TotalsAmount display={totalsDisplay} />
          </Box>
        </>
      )}
    </Box>
  );
}
