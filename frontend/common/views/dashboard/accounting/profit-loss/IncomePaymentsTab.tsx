"use client";

import { FileDownloadOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import type { GridColDef, GridRowParams } from "@mui/x-data-grid";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { formatDate } from "@/frontend/common/components/intl/dateFormat";
import { ExportButton } from "@/frontend/common/components/ui/button/ActionButtons";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { formatLockedAmount } from "@/frontend/common/lib/currency";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useProfitLossFilterStore } from "@/frontend/common/stores/profitLossFilterStore";
import { logger } from "@/frontend/common/utils/logger";
import { PaymentMethodChip } from "@/frontend/common/views/dashboard/accounting/profit-loss/PaymentMethodChip";
import type {
  ProfitLossIncomeRow,
  ProfitLossViewModel,
} from "@/frontend/common/views/dashboard/accounting/profit-loss/useProfitLossViewModel";
import type { ProfitLossLabels } from "@/shared/locale/types/dashboard/accounting/profit-loss";

type IncomePaymentsTabProps = Pick<
  ProfitLossViewModel,
  "labels" | "incomePage" | "month" | "currency" | "isLoading" | "onIncomePageChange" | "pageSize"
>;

const CSV_EXPORT_URL = "/api/profit-loss/income/export";

/** Placeholder used when a row's linked value is absent (free-form payment, no invoice). */
const MISSING_VALUE = "—";

function buildIncomeExportUrl(month: string, currency: string): string {
  const params = new URLSearchParams({ month, currency });
  return `${CSV_EXPORT_URL}?${params.toString()}`;
}

/**
 * Runs one CSV download of the month's income payments. Resolves to null when
 * the download failed, so the caller's busy flag always clears; the server's
 * truncation header is passed through for the caller to surface.
 */
function useIncomeCsvExport(month: string, currency: string): () => Promise<{ truncated: boolean } | null> {
  return useCallback(async () => {
    const url = buildIncomeExportUrl(month, currency);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        logger.error("Income payments CSV export request failed", { status: response.status, url });
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
      logger.error("Income payments CSV export failed", { error: exportError, url });
      return null;
    }
  }, [month, currency]);
}

/** Builds the tab's columns; chip cells render via the shared chip, absent values show a dash. */
function buildIncomeColumns(labels: ProfitLossLabels, locale: string): GridColDef<ProfitLossIncomeRow>[] {
  return [
    {
      field: "paymentDate",
      headerName: labels.column.paymentDate,
      flex: 1,
      valueGetter: (_value, row) => (row.paymentDate ? formatDate(row.paymentDate, locale) : MISSING_VALUE),
    },
    {
      field: "invoiceId",
      headerName: labels.column.invoiceId,
      flex: 1,
      valueGetter: (_value, row) => row.invoiceId ?? MISSING_VALUE,
    },
    { field: "studentName", headerName: labels.column.student, flex: 1 },
    {
      field: "parentName",
      headerName: labels.column.parentName,
      flex: 1,
      valueGetter: (_value, row) => row.parentName ?? MISSING_VALUE,
    },
    {
      field: "packageName",
      headerName: labels.column.packageName,
      flex: 1,
      valueGetter: (_value, row) => row.packageName ?? MISSING_VALUE,
    },
    {
      field: "paymentMethodType",
      headerName: labels.column.paymentMethod,
      flex: 1,
      sortable: false,
      filterable: false,
      renderCell: params =>
        params.row.paymentMethodType ? (
          <PaymentMethodChip paymentMethodType={params.row.paymentMethodType} />
        ) : (
          MISSING_VALUE
        ),
    },
    {
      field: "amount",
      headerName: labels.column.value,
      flex: 1,
      valueGetter: (_value, row) =>
        row.amount && row.currency ? formatLockedAmount(row.amount, row.currency, locale) : MISSING_VALUE,
    },
  ];
}

/**
 * Income Payments tab of the P&L dashboard: paginated student payment rows
 * for the selected month, a footer total in the dominant currency with the
 * FX-excluded row count, and a CSV export of the whole month. Row clicks
 * drill down to the linked invoice on the invoices page.
 */
export function IncomePaymentsTab(props: Readonly<IncomePaymentsTabProps>) {
  const { labels, incomePage, month, currency, isLoading, onIncomePageChange, pageSize } = props;
  const router = useRouter();
  const locale = useAppLocale();
  const currentPage = useProfitLossFilterStore(state => state.incomePage);
  const columns = buildIncomeColumns(labels, locale);
  const runExport = useIncomeCsvExport(month, currency);
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
    (row: ProfitLossIncomeRow) => {
      if (row.invoiceId !== null) {
        router.push(`/billing/invoices?invoiceId=${row.invoiceId}`);
      }
    },
    [router]
  );
  const handleGridRowClick = useCallback(
    (params: GridRowParams<ProfitLossIncomeRow>) => {
      handleRowClick(params.row);
    },
    [handleRowClick]
  );

  const aggregate = incomePage.aggregate;
  const total = aggregate?.totalIncomePayments ?? "0";
  const dominant = aggregate?.dominantCurrency ?? null;
  const excludedCount = aggregate?.excludedRowCount ?? 0;

  return (
    <Stack sx={{ gap: 2 }} component="section" aria-label={labels.tab.incomePayments}>
      <AppDataGrid<ProfitLossIncomeRow>
        rows={[...incomePage.rows]}
        columns={columns}
        getRowId={row => row.id ?? row.paymentId ?? ""}
        onRowClick={handleGridRowClick}
        loading={isLoading}
        emptyMessage={labels.empty.description}
        paginationOptions={buildServerPaginationOptions({
          page: currentPage,
          pageSize,
          totalCount: incomePage.totalCount,
          onPageChange: onIncomePageChange,
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
          <Typography variant="titleLg" sx={{ fontWeight: 600 }}>
            {`${labels.aggregate.totalIncomePayments}: ${total} ${dominant ?? currency}`}
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
          id="profit-loss-income-export-csv"
          startIcon={<FileDownloadOutlined />}
          disabled={exporting || isLoading || incomePage.totalCount === 0}
          onClick={handleExportClick}
        >
          {labels.action.exportCsv}
        </ExportButton>
      </Stack>
    </Stack>
  );
}
