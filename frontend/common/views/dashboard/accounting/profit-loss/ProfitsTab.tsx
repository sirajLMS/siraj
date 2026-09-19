"use client";

import { FileDownloadOutlined } from "@mui/icons-material";
import { Box, Stack, type SxProps, type Theme, Typography } from "@mui/material";
import { useCallback, useState } from "react";
import { ExportButton } from "@/frontend/common/components/ui";
import { logger } from "@/frontend/common/utils/logger";
import { formatAccountingMoney } from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import type { ProfitLossViewModel } from "@/frontend/common/views/dashboard/accounting/profit-loss/useProfitLossViewModel";

type ProfitsTabProps = Pick<ProfitLossViewModel, "labels" | "summary" | "month" | "currency" | "isLoading">;

const CSV_EXPORT_URL = "/api/profit-loss/summary/export";
/** Placeholder rendered when the margin has no income base to divide by. */
const MISSING_VALUE = "—";

/** Sign of the Net Profit figure, resolved once and reused for color and status text. */
type NetProfitSign = "positive" | "negative" | "breakeven";

function netProfitSign(netProfit: string | null): NetProfitSign {
  const value = netProfit === null ? 0 : Number(netProfit);
  if (Number.isNaN(value) || value === 0) return "breakeven";
  return value > 0 ? "positive" : "negative";
}

/** Palette token for each Net Profit sign: green when positive, red when negative, grey at zero. */
function netProfitStatusColor(sign: NetProfitSign, theme: Theme): string {
  if (sign === "positive") return theme.palette.success.main;
  if (sign === "negative") return theme.palette.error.main;
  return theme.palette.text.disabled;
}

/** Localized sign caption ("Profit" / "Loss" / "Break-even") for the Net Profit row. */
function netProfitStatusText(sign: NetProfitSign, labels: ProfitLossTabLabels): string {
  if (sign === "positive") return labels.status.positive;
  if (sign === "negative") return labels.status.negative;
  return labels.status.breakeven;
}

type ProfitLossTabLabels = ProfitLossViewModel["labels"];

const SUMMARY_TABLE_SX: SxProps<Theme> = theme => ({
  width: "100%",
  borderCollapse: "collapse",
  "& th": {
    pb: 1.5,
    px: 1.5,
    textAlign: "start",
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  "& td": {
    py: 1.5,
    px: 1.5,
    textAlign: "end",
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  "& th:last-child, & td:last-child": { px: 0 },
  "& tr:last-child th, & tr:last-child td": { borderBottom: "none" },
});

interface SummaryRowProps {
  /** Row header, rendered in a scope="row" cell so screen readers announce it per value. */
  readonly label: string;
  readonly amount: string | null;
  readonly currency: string;
  /** Sign-aware styling; defaults to the surface text color. */
  readonly colorSx?: (theme: Theme) => { color: string };
  /** Secondary figure shown beside the amount (the margin percentage on the Net Profit row). */
  readonly trailing?: string;
  /** Extra context announced to assistive tech alongside the amount. */
  readonly ariaLabel?: string;
}

function SummaryRow({ label, amount, currency, colorSx, trailing, ariaLabel }: Readonly<SummaryRowProps>) {
  return (
    <Box component="tr">
      <Box component="th" scope="row">
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {label}
        </Typography>
      </Box>
      <Box component="td">
        <Stack direction="row" sx={{ justifyContent: "flex-end", alignItems: "baseline", gap: 1 }}>
          {trailing !== undefined ? (
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {trailing}
            </Typography>
          ) : null}
          <Typography
            variant="titleLg"
            sx={theme => (colorSx ? colorSx(theme) : { color: theme.palette.onSurface })}
            aria-label={ariaLabel}
          >
            {`${formatAccountingMoney(amount)} ${currency}`}
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}

function buildSummaryExportUrl(month: string, currency: string): string {
  const params = new URLSearchParams({ month, currency });
  return `${CSV_EXPORT_URL}?${params.toString()}`;
}

/**
 * Runs one CSV download of the summary table. Failures are logged and resolve
 * normally so the export button's busy lock always clears; the wrapped fetch
 * never rejects past this hook.
 */
function useSummaryCsvExport(month: string, currency: string): () => Promise<void> {
  return useCallback(async () => {
    const url = buildSummaryExportUrl(month, currency);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        logger.error("P&L summary CSV export request failed", { status: response.status, url });
        return;
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (exportError) {
      logger.error("P&L summary CSV export failed", { error: exportError, url });
    }
  }, [month, currency]);
}

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
