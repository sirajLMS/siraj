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

interface ReportsTotalsSectionMobileProps {
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
            maxWidth: "100%",
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

export function ReportsTotalsSectionMobile({ summary, rows, totalsLabel }: Readonly<ReportsTotalsSectionMobileProps>) {
  const { hasPermission } = useUserStore();
  const showFinancials = hasPermission(AppPermission.ReportViewFinancials);
  const totalsDisplay = useTotalsDisplay(rows);

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
          <TotalsAmount display={totalsDisplay} />
        </Stack>
      </Stack>
    </Box>
  );
}
