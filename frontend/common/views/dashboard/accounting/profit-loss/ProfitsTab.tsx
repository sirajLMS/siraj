"use client";

import { FileDownloadOutlined } from "@mui/icons-material";
import { Box, Stack } from "@mui/material";
import { useCallback, useState } from "react";
import { ExportButton } from "@/frontend/common/components/ui";
import { formatAccountingMoney } from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import {
  MISSING_VALUE,
  netProfitSign,
  netProfitStatusColor,
  netProfitStatusText,
} from "@/frontend/common/views/dashboard/accounting/profit-loss/ProfitsTab.helpers";
import { useSummaryCsvExport } from "@/frontend/common/views/dashboard/accounting/profit-loss/ProfitsTab.hooks";
import {
  SUMMARY_TABLE_SX,
  SummaryRow,
} from "@/frontend/common/views/dashboard/accounting/profit-loss/ProfitsTab.parts";
import type { ProfitLossViewModel } from "@/frontend/common/views/dashboard/accounting/profit-loss/useProfitLossViewModel";

type ProfitsTabProps = Pick<ProfitLossViewModel, "labels" | "summary" | "month" | "currency" | "isLoading">;

/**
 * Executive summary tab of the profit & loss dashboard: four rows — income
 * payments, total payments, total expenses, and net profit (colored by sign,
 * with the margin percentage alongside whenever there is an income base to
 * divide by). The CSV export downloads the same summary from the summary
 * export route for the selected month and currency.
 */
export function ProfitsTab({ labels, summary, month, currency, isLoading }: Readonly<ProfitsTabProps>) {
  const [exporting, setExporting] = useState(false);
  const runExport = useSummaryCsvExport(month, currency);

  const handleExportClick = useCallback(() => {
    const run = async () => {
      setExporting(true);
      await runExport();
      setExporting(false);
    };
    void run();
  }, [runExport]);

  const sign = netProfitSign(summary?.netProfit ?? null);
  const statusText = netProfitStatusText(sign, labels);
  const margin =
    summary !== null && Number(summary.totalPayments) > 0
      ? `${summary.netProfitMargin ?? MISSING_VALUE}%`
      : MISSING_VALUE;
  const marginTrailing = `${labels.aggregate.netProfitMargin}: ${margin}`;
  const netProfitAriaLabel =
    summary === null
      ? undefined
      : `${labels.aggregate.netProfit}: ${formatAccountingMoney(summary.netProfit)} ${currency}, ${statusText}`;

  return (
    <Stack sx={{ gap: 2 }} component="section" aria-label={labels.tab.profits}>
      <Box sx={{ overflowX: "auto" }}>
        <Box component="table" sx={SUMMARY_TABLE_SX}>
          <Box component="tbody">
            <SummaryRow
              label={labels.aggregate.totalIncomePayments}
              amount={summary?.totalIncomePayments ?? null}
              currency={currency}
            />
            <SummaryRow
              label={labels.aggregate.totalPayments}
              amount={summary?.totalPayments ?? null}
              currency={currency}
            />
            <SummaryRow
              label={labels.aggregate.totalExpenses}
              amount={summary?.totalExpenses ?? null}
              currency={currency}
            />
            <SummaryRow
              label={labels.aggregate.netProfit}
              amount={summary?.netProfit ?? null}
              currency={currency}
              colorSx={theme => ({ color: netProfitStatusColor(sign, theme) })}
              trailing={marginTrailing}
              ariaLabel={netProfitAriaLabel}
            />
          </Box>
        </Box>
      </Box>
      <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
        <ExportButton
          id="profit-loss-summary-export-csv"
          startIcon={<FileDownloadOutlined />}
          disabled={exporting || isLoading || summary === null}
          onClick={handleExportClick}
          size="small"
        >
          {labels.action.exportCsv}
        </ExportButton>
      </Stack>
    </Stack>
  );
}
