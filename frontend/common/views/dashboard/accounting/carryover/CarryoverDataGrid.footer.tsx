"use client";

import AccountBalanceWalletOutlined from "@mui/icons-material/AccountBalanceWalletOutlined";
import { Box, Stack, Typography } from "@mui/material";
import { SectionPanel, StatusBadge } from "@/frontend/common/components/ui";
import { formatAccountingMoney } from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import type { CarryoverAggregates } from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel";
import type { CarryoverLabels } from "@/shared/locale/types/dashboard/accounting/carryover";

interface AggregateAmountProps {
  readonly label: string;
  readonly amount: string | null;
  readonly currency: string | null;
}

/** One footer money figure: small caps label over the amount and dominant currency. */
function AggregateAmount({ label, amount, currency }: Readonly<AggregateAmountProps>) {
  return (
    <Stack sx={{ gap: 0.5 }}>
      <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
        {label}
      </Typography>
      <Stack direction="row" sx={{ alignItems: "baseline", gap: 1 }}>
        <Typography variant="titleLg">{formatAccountingMoney(amount)}</Typography>
        {currency !== null ? (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {currency}
          </Typography>
        ) : null}
      </Stack>
    </Stack>
  );
}

interface CarryoverAggregateFooterProps {
  readonly aggregates: CarryoverAggregates;
  /** Total rows across all pages of the current filter, shown as the records tally. */
  readonly totalCount: number;
  readonly labels: CarryoverLabels;
}

/**
 * Footer card under the grid summarizing the whole filtered set (all pages):
 * total payable, total paid, the record tally, and the paid vs unpaid tallies.
 */
export function CarryoverAggregateFooter({ aggregates, totalCount, labels }: Readonly<CarryoverAggregateFooterProps>) {
  return (
    <SectionPanel>
      <Stack
        direction={{ xs: "column", md: "row" }}
        sx={{ flexWrap: "wrap", gap: 3, alignItems: { xs: "flex-start", md: "center" } }}
      >
        <AggregateAmount
          label={labels.aggregate.totalPayable}
          amount={aggregates.totalPayable}
          currency={aggregates.dominantCurrency}
        />
        <AggregateAmount
          label={labels.aggregate.totalPaid}
          amount={aggregates.totalPaid}
          currency={aggregates.dominantCurrency}
        />
        <Typography
          variant="bodyMd"
          sx={theme => ({ color: theme.palette.onSurfaceVariant, marginInlineStart: { xs: 0, md: "auto" } })}
        >
          {labels.aggregate.recordsCount(totalCount)}
        </Typography>
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 2, alignItems: "center" }}>
          <Stack direction="row" sx={{ alignItems: "center", gap: 0.5 }}>
            <StatusBadge category="session" status="active" label={labels.chip.paid} />
            <Typography variant="bodyMd">{labels.aggregate.paidCount(aggregates.rowCountByPaid.paid)}</Typography>
          </Stack>
          <Stack direction="row" sx={{ alignItems: "center", gap: 0.5 }}>
            <StatusBadge category="session" status="pending" label={labels.chip.unpaid} />
            <Typography variant="bodyMd">{labels.aggregate.unpaidCount(aggregates.rowCountByPaid.unpaid)}</Typography>
          </Stack>
        </Stack>
      </Stack>
    </SectionPanel>
  );
}

/**
 * Zero-row panel rendered by the grid's no-rows slot: a muted wallet glyph,
 * the headings, and the guidance hint. Widths are symmetric and direction-free
 * so the panel reads identically in RTL.
 */
export function CarryoverEmptyStateContent({ heading, hint }: Readonly<{ heading: string; hint: string }>) {
  return (
    <Stack
      sx={{
        height: "100%",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        px: 2,
        py: 6,
        textAlign: "center",
      }}
    >
      <Box
        sx={theme => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 56,
          height: 56,
          borderRadius: "50%",
          mb: 0.5,
          backgroundColor: theme.palette.action.hover,
          color: theme.palette.text.secondary,
        })}
      >
        <AccountBalanceWalletOutlined fontSize="large" />
      </Box>
      <Typography variant="titleLg">{heading}</Typography>
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, maxWidth: 360 })}>
        {hint}
      </Typography>
    </Stack>
  );
}
