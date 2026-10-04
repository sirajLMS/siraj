"use client";

import { Stack } from "@mui/material";
import type { GridRowParams } from "@mui/x-data-grid";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { formatLockedAmount } from "@/frontend/common/lib/currency";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useProfitLossFilterStore } from "@/frontend/common/stores/profitLossFilterStore";
import { TabAggregateFooter } from "@/frontend/common/views/dashboard/accounting/profit-loss/__shared__";
import { buildPaymentColumns } from "@/frontend/common/views/dashboard/accounting/profit-loss/PaymentsTab.columns";
import { usePaymentsCsvExport } from "@/frontend/common/views/dashboard/accounting/profit-loss/PaymentsTab.hooks";
import type {
  ProfitLossPaymentRow,
  ProfitLossViewModel,
} from "@/frontend/common/views/dashboard/accounting/profit-loss/useProfitLossViewModel";

/** View-model slice the Payments tab renders from. */
export type PaymentsTabProps = Pick<
  ProfitLossViewModel,
  "labels" | "paymentsPage" | "month" | "currency" | "isLoading" | "onPaymentsPageChange" | "pageSize"
>;

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
      <TabAggregateFooter
        labels={{
          total: labels.aggregate.totalPayments,
          dominant: labels.aggregate.dominantCurrency,
          excludedRows: labels.aggregate.excludedRows,
          exportCsv: labels.action.exportCsv,
        }}
        formattedTotal={formatLockedAmount(total, currency, locale)}
        dominant={dominant}
        excludedCount={excludedCount}
        totalCount={paymentsPage.totalCount}
        isLoading={isLoading}
        runExport={runExport}
        exportButtonId="profit-loss-payments-export-csv"
      />
    </Stack>
  );
}
