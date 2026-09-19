"use client";

import { FileDownloadOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import type { GridColDef, GridRowParams } from "@mui/x-data-grid";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { ExportButton } from "@/frontend/common/components/ui/button/ActionButtons";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { formatLockedAmount } from "@/frontend/common/lib/currency";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useProfitLossFilterStore } from "@/frontend/common/stores/profitLossFilterStore";
import { logger } from "@/frontend/common/utils/logger";
import {
  dateCell,
  formatAccountingDate,
  numericCell,
  textCell,
} from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import { CalculationStatusChip } from "@/frontend/common/views/dashboard/accounting/profit-loss/CalculationStatusChip";
import type {
  ProfitLossPaymentRow,
  ProfitLossViewModel,
} from "@/frontend/common/views/dashboard/accounting/profit-loss/useProfitLossViewModel";
import type { ProfitLossLabels } from "@/shared/locale/types/dashboard/accounting/profit-loss";

/** View-model slice the Payments tab renders from. */
export type PaymentsTabProps = Pick<
  ProfitLossViewModel,
  "labels" | "paymentsPage" | "month" | "currency" | "isLoading" | "onPaymentsPageChange" | "pageSize"
>;

/** Route that streams the month's payments rows as a CSV download. */
const CSV_EXPORT_URL = "/api/profit-loss/payments/export";

/** Placeholder used when a row's linked value is absent. */
const MISSING_VALUE = "—";

function buildPaymentsExportUrl(month: string, currency: string): string {
  const params = new URLSearchParams({ month, currency });
  return `${CSV_EXPORT_URL}?${params.toString()}`;
}

/**
 * Runs one CSV download of the month's earned-revenue rows. Resolves to null
 * when the download failed, so the caller's busy flag always clears; the
 * server's truncation header is passed through for the caller to surface.
 */
function usePaymentsCsvExport(month: string, currency: CurrencyCode): () => Promise<{ truncated: boolean } | null> {
  return useCallback(async () => {
    const url = buildPaymentsExportUrl(month, currency);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        logger.error("Payments CSV export request failed", { status: response.status, url });
        return null;
      }
      const truncated = response.headers.get("X-Export-Truncated") === "true";
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      return { truncated };
    } catch (exportError) {
      logger.error("Payments CSV export failed", { error: exportError, url });
      return null;
    }
  }, [month, currency]);
}

interface PaymentColumnArgs {
  readonly labels: ProfitLossLabels;
  readonly locale: string;
  /** Report target currency the converted-amount column is expressed in. */
  readonly currency: CurrencyCode;
}

/**
 * Earned-revenue columns per the report contract: the session's scheduled
 * start, the people and subject involved, the calculated duration, the
 * student-paid amount in its original currency, the FX-converted amount the
 * footer total sums, the manual subtract credits, and the payroll calculation
 * badge.
 */
function buildPaymentColumns({ labels, locale, currency }: PaymentColumnArgs): GridColDef<ProfitLossPaymentRow>[] {
  return [
    {
      field: "scheduledStartAt",
      headerName: labels.column.scheduledStart,
      width: 150,
      valueFormatter: value => formatAccountingDate(dateCell(value), locale),
    },
    {
      field: "teacherName",
      headerName: labels.column.teacher,
      flex: 1,
      minWidth: 140,
      valueFormatter: value => textCell(value),
    },
    {
      field: "studentName",
      headerName: labels.column.student,
      flex: 1,
      minWidth: 140,
      valueFormatter: value => textCell(value),
    },
    {
      field: "subjectName",
      headerName: labels.column.subject,
      flex: 1,
      minWidth: 120,
      valueFormatter: value => textCell(value),
    },
    {
      field: "durationMinutes",
      headerName: labels.column.duration,
      width: 110,
      align: "right",
      headerAlign: "right",
      valueFormatter: value => numericCell(value),
    },
    {
      field: "studentPaidAmount",
      headerName: labels.column.studentPaidAmount,
      width: 150,
      align: "right",
      headerAlign: "right",
      valueGetter: (_value, row) =>
        row.studentPaidAmount && row.studentPaidCurrency
          ? formatLockedAmount(row.studentPaidAmount, row.studentPaidCurrency, locale)
          : MISSING_VALUE,
    },
    {
      field: "convertedAmount",
      headerName: labels.column.value,
      width: 150,
      align: "right",
      headerAlign: "right",
      valueGetter: (_value, row) =>
        row.convertedAmount ? formatLockedAmount(row.convertedAmount, currency, locale) : MISSING_VALUE,
    },
    {
      field: "manualSubtractCredits",
      headerName: labels.column.manualSubtractCredits,
      width: 150,
      align: "right",
      headerAlign: "right",
      valueGetter: (_value, row) =>
        row.manualSubtractCredits && row.manualSubtractCreditsCurrency
          ? formatLockedAmount(row.manualSubtractCredits, row.manualSubtractCreditsCurrency, locale)
          : MISSING_VALUE,
    },
    {
      field: "calculationStatus",
      headerName: labels.column.calculationStatus,
      width: 130,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) =>
        row.calculationStatus === null ? null : <CalculationStatusChip status={row.calculationStatus} />,
    },
  ];
}

/**
 * Earned-revenue tab of the profit & loss dashboard: one server page of
 * completed, calculated sessions per grid, with the month's Total Payments
 * footer (converted into the report's target currency) and the CSV export
 * action. Row clicks drill down to the class audit page for the session.
 */
export function PaymentsTab(props: Readonly<PaymentsTabProps>) {
  const { labels, paymentsPage, month, currency, isLoading, onPaymentsPageChange, pageSize } = props;
  const router = useRouter();
  const locale = useAppLocale();
  const currentPage = useProfitLossFilterStore(state => state.paymentsPage);
  const columns = useMemo(() => buildPaymentColumns({ labels, locale, currency }), [labels, locale, currency]);
  const runExport = usePaymentsCsvExport(month, currency);
  const [exporting, setExporting] = useState(false);

  const handleExportClick = useCallback(() => {
    const run = async () => {
      setExporting(true);
      await runExport();
      setExporting(false);
    };
    void run();
  }, [runExport]);

  const handleRowClick = useCallback(
    (params: GridRowParams<ProfitLossPaymentRow>) => {
      const instanceId = params.row.instanceId;
      if (instanceId !== null) {
        router.push(`/classes/${instanceId}/audit?highlight=payroll`);
      }
    },
    [router]
  );

  const aggregate = paymentsPage.aggregate;
  const total = aggregate?.totalPayments ?? "0";
  const dominant = aggregate?.dominantCurrency ?? null;
  const excludedCount = aggregate?.excludedRowCount ?? 0;
  return (
    <Stack sx={{ gap: 2 }} component="section" aria-label={labels.tab.payments}>
      <AppDataGrid<ProfitLossPaymentRow>
        rows={[...paymentsPage.rows]}
        columns={columns}
        getRowId={row => row.instanceId ?? row.id ?? ""}
        onRowClick={handleRowClick}
        loading={isLoading}
        emptyMessage={labels.empty.description}
        paginationOptions={buildServerPaginationOptions({
          page: currentPage,
          pageSize,
          totalCount: paymentsPage.totalCount,
          onPageChange: onPaymentsPageChange,
        })}
      />
      <Stack
        sx={{
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography variant="titleLg">
            {`${labels.aggregate.totalPayments}: ${formatLockedAmount(total, currency, locale)}`}
          </Typography>
          {dominant !== null && (
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {`${labels.aggregate.dominantCurrency}: ${dominant}`}
            </Typography>
          )}
          {excludedCount > 0 && (
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {labels.aggregate.excludedRows(excludedCount)}
            </Typography>
          )}
        </Box>
        <ExportButton
          id="profit-loss-payments-export-csv"
          startIcon={<FileDownloadOutlined />}
          disabled={exporting || isLoading || paymentsPage.totalCount === 0}
          onClick={handleExportClick}
        >
          {labels.action.exportCsv}
        </ExportButton>
      </Stack>
    </Stack>
  );
}
