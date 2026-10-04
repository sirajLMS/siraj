"use client";

import { Stack, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { SectionPanel, StatusBadge } from "@/frontend/common/components/ui";
import { formatAccountingMoney } from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import {
  expenseTypeFromAggregateKey,
  expenseTypeLabel,
} from "@/frontend/common/views/dashboard/accounting/expenses/ExpensesDataGrid.helpers";
import type { ExpenseAggregates } from "@/frontend/common/views/dashboard/accounting/expenses/useExpensesViewModel";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

interface AggregateAmountProps {
  readonly label: string;
  readonly amount: string | null;
  readonly currency: string | null;
}

/** One footer money figure: small caps label over the amount and dominant currency. */
function AggregateAmount({ label, amount, currency }: Readonly<AggregateAmountProps>) {
  return (
    <Stack sx={{ gap: 0.5 }}>
      <Typography variant="labelUppercase" sx={(theme: Theme) => ({ color: theme.palette.onSurfaceVariant })}>
        {label}
      </Typography>
      <Stack direction="row" sx={{ alignItems: "baseline", gap: 1 }}>
        <Typography variant="titleLg">{formatAccountingMoney(amount)}</Typography>
        {currency !== null ? (
          <Typography variant="bodyMd" sx={(theme: Theme) => ({ color: theme.palette.onSurfaceVariant })}>
            {currency}
          </Typography>
        ) : null}
      </Stack>
    </Stack>
  );
}

/** One plain footer figure without a currency companion, e.g. the records tally. */
function AggregateCount({ label, count }: Readonly<{ label: string; count: number }>) {
  return (
    <Stack sx={{ gap: 0.5 }}>
      <Typography variant="labelUppercase" sx={(theme: Theme) => ({ color: theme.palette.onSurfaceVariant })}>
        {label}
      </Typography>
      <Typography variant="titleLg">{count}</Typography>
    </Stack>
  );
}

/** Type tally in the footer: the same badge the grid rows render plus its row count. */
function ExpenseTypeTally({
  typeKey,
  labels,
  count,
}: Readonly<{ typeKey: string; labels: ExpensesLabels; count: number }>) {
  const type = expenseTypeFromAggregateKey(typeKey);
  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 0.5 }}>
      {type !== null ? (
        <StatusBadge category="expenseType" status={type} label={expenseTypeLabel(labels, type)} />
      ) : null}
      <Typography variant="bodyMd">{count}</Typography>
    </Stack>
  );
}

interface ExpensesAggregateFooterProps {
  readonly aggregates: ExpenseAggregates;
  /** Total rows across all pages of the current filter, shown as the records tally. */
  readonly totalCount: number;
  readonly labels: ExpensesLabels;
}

/**
 * Footer card under the grid summarizing the whole filtered set (all pages):
 * the total value in the dominant currency, the records tally, and the
 * per-type tallies with the same badges the rows render.
 */
export function ExpensesAggregateFooter({ aggregates, totalCount, labels }: Readonly<ExpensesAggregateFooterProps>) {
  const typeTallies = Object.entries(aggregates.rowCountByType);
  return (
    <SectionPanel>
      <Stack
        direction={{ xs: "column", md: "row" }}
        sx={{ flexWrap: "wrap", gap: 3, alignItems: { xs: "flex-start", md: "center" } }}
      >
        <AggregateAmount
          label={labels.aggregate.totalValue}
          amount={aggregates.totalValue}
          currency={aggregates.dominantCurrency}
        />
        <AggregateCount label={labels.aggregate.rowCount} count={totalCount} />
        <Stack
          direction="row"
          sx={{ flexWrap: "wrap", gap: 2, alignItems: "center", marginInlineStart: { xs: 0, md: "auto" } }}
        >
          {typeTallies.map(([typeKey, count]) => (
            <ExpenseTypeTally key={typeKey} typeKey={typeKey} labels={labels} count={count} />
          ))}
        </Stack>
      </Stack>
    </SectionPanel>
  );
}
