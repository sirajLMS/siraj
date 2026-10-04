"use client";

import { Stack } from "@mui/material";
import type { GridRowParams } from "@mui/x-data-grid";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useProfitLossFilterStore } from "@/frontend/common/stores/profitLossFilterStore";
import { TabAggregateFooter } from "@/frontend/common/views/dashboard/accounting/profit-loss/__shared__";
import { buildIncomeColumns } from "@/frontend/common/views/dashboard/accounting/profit-loss/IncomePaymentsTab.columns";
import { useIncomeCsvExport } from "@/frontend/common/views/dashboard/accounting/profit-loss/IncomePaymentsTab.hooks";
import type {
  ProfitLossIncomeRow,
  ProfitLossViewModel,
} from "@/frontend/common/views/dashboard/accounting/profit-loss/useProfitLossViewModel";

type IncomePaymentsTabProps = Pick<
  ProfitLossViewModel,
  "labels" | "incomePage" | "month" | "currency" | "isLoading" | "onIncomePageChange" | "pageSize"
>;

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
      <TabAggregateFooter
        labels={{
          total: labels.aggregate.totalIncomePayments,
          dominant: labels.aggregate.dominantCurrency,
          excludedRows: labels.aggregate.excludedRows,
          exportCsv: labels.action.exportCsv,
        }}
        formattedTotal={`${total} ${dominant ?? currency}`}
        dominant={dominant}
        excludedCount={excludedCount}
        totalCount={incomePage.totalCount}
        isLoading={isLoading}
        runExport={runExport}
        exportButtonId="profit-loss-income-export-csv"
        titleFontWeight={600}
      />
    </Stack>
  );
}
