"use client";

import { FileDownloadOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { ExportButton } from "@/frontend/common/components/ui/button/ActionButtons";
import { formatAccountingMoney } from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import { ExpenseTypeTally } from "@/frontend/common/views/dashboard/accounting/profit-loss/ExpensesTab.cells";
import { toTypeTallies } from "@/frontend/common/views/dashboard/accounting/profit-loss/ExpensesTab.helpers";
import type { ProfitLossViewModel } from "@/frontend/common/views/dashboard/accounting/profit-loss/useProfitLossViewModel";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";
import type { ProfitLossLabels } from "@/shared/locale/types/dashboard/accounting/profit-loss";

interface ExpensesTabFooterProps {
  readonly labels: ProfitLossLabels;
  readonly typeLabels: ExpensesLabels;
  readonly currency: string;
  readonly expensesPage: ProfitLossViewModel["expensesPage"];
  readonly exporting: boolean;
  readonly isLoading: boolean;
  readonly onExport: () => void;
}

/** Whole-month expense total, dominant currency, per-type tallies, and the CSV export action. */
export function ExpensesTabFooter({
  labels,
  typeLabels,
  currency,
  expensesPage,
  exporting,
  isLoading,
  onExport,
}: Readonly<ExpensesTabFooterProps>) {
  const aggregate = expensesPage.aggregate;
  const total = aggregate?.totalExpenses ?? "0";
  const dominant = aggregate?.dominantCurrency ?? null;
  const excludedCount = aggregate?.excludedRowCount ?? 0;
  const typeTallies = aggregate === null ? [] : toTypeTallies(aggregate.rowCountByType);

  return (
    <Stack
      sx={{
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "space-between",
        gap: 1,
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Typography variant="titleLg">{`${labels.aggregate.totalExpenses}: ${formatAccountingMoney(total)} ${
          dominant ?? currency
        }`}</Typography>
        {dominant !== null && (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {`${labels.aggregate.dominantCurrency}: ${dominant}`}
          </Typography>
        )}
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, alignItems: "center" }}>
          {typeTallies.map(([typeKey, count]) => (
            <ExpenseTypeTally key={typeKey} typeKey={typeKey} typeLabels={typeLabels} count={count} />
          ))}
        </Stack>
        {excludedCount > 0 && (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {labels.aggregate.excludedRows(excludedCount)}
          </Typography>
        )}
      </Box>
      <ExportButton
        id="profit-loss-expenses-export-csv"
        startIcon={<FileDownloadOutlined />}
        disabled={exporting || isLoading || expensesPage.totalCount === 0}
        onClick={onExport}
      >
        {labels.action.exportCsv}
      </ExportButton>
    </Stack>
  );
}
