"use client";

import { Box, Stack, Tooltip, Typography } from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { buildFxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import {
  type BillingCurrencyBucket,
  formatBillingCurrencyTotals,
} from "@/frontend/common/lib/formatBillingCurrencyTotals";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { ReportLedgerRow, ReportsSummary } from "@/frontend/views/dashboard/reports/types/reportsTypes";
import { aggregatePaidAmountTotals } from "@/frontend/views/dashboard/reports/utils/formatReportPaidAmounts";

interface ReportsTotalsSectionProps {
  readonly summary: ReportsSummary;
  readonly rows: readonly ReportLedgerRow[];
  readonly totalsLabel: string;
  readonly variant: "desktop" | "mobile";
}

function useTotalsDisplay(rows: readonly ReportLedgerRow[]) {
  const locale = useLocale();
  const tProfile = useTranslations("profile");
  const tErrors = useTranslations("errors");

  return useMemo(() => {
    const paidTotals = aggregatePaidAmountTotals(rows);
    if (paidTotals.length === 0) {
      return { primary: "—", ariaLabel: tProfile("notSet") };
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

    return formatBillingCurrencyTotals(buckets, locale, buildFxDisplayMessages(tProfile, tErrors));
  }, [rows, locale, tProfile, tErrors]);
}

function TotalsAmount({
  display,
  variant,
}: {
  readonly display: { primary: string; breakdown?: string; ariaLabel?: string };
  readonly variant: "desktop" | "mobile";
}) {
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
            maxWidth: variant === "mobile" ? "100%" : 240,
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

export function ReportsTotalsSection({ summary, rows, totalsLabel, variant }: Readonly<ReportsTotalsSectionProps>) {
  const { hasPermission } = useUserStore();
  const showFinancials = hasPermission(AppPermission.ReportViewFinancials);
  const totalsDisplay = useTotalsDisplay(rows);

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
            <TotalsAmount display={totalsDisplay} variant="mobile" />
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
            <TotalsAmount display={totalsDisplay} variant="desktop" />
          </Box>
        </>
      )}
    </Box>
  );
}
