"use client";

import { Box } from "@mui/material";
import type { GridRowParams } from "@mui/x-data-grid";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useProfitLossFilterStore } from "@/frontend/common/stores/profitLossFilterStore";
import { logger } from "@/frontend/common/utils/logger";
import { CarryoverDetailDrawer } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDetailDrawer";
import { useExpensesColumns } from "@/frontend/common/views/dashboard/accounting/profit-loss/ExpensesTab.columns";
import { useExpensesCsvExport } from "@/frontend/common/views/dashboard/accounting/profit-loss/ExpensesTab.hooks";
import { ExpensesTabFooter } from "@/frontend/common/views/dashboard/accounting/profit-loss/ExpensesTabFooter.parts";
import type {
  ProfitLossExpenseRow,
  ProfitLossViewModel,
} from "@/frontend/common/views/dashboard/accounting/profit-loss/useProfitLossViewModel";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingExpenses } from "@/shared/locale/namespaces";

type ExpensesTabProps = Pick<
  ProfitLossViewModel,
  "labels" | "expensesPage" | "month" | "currency" | "isLoading" | "onExpensesPageChange" | "pageSize"
>;

/**
 * Expenses tab of the P&L dashboard: paginated expense-ledger rows for the
 * selected month, a footer with the whole-month total in the dominant
 * currency plus per-type tallies, the FX-excluded row count when present, a
 * CSV export of the month, and drill-downs — the row navigates to the
 * expense detail page while the "From Carryover" chip opens the carryover
 * drawer for the row's linked balance.
 */
export function ExpensesTab(props: Readonly<ExpensesTabProps>) {
  const { labels, expensesPage, month, currency, isLoading, onExpensesPageChange, pageSize } = props;
  const router = useRouter();
  const locale = useAppLocale();
  const expensesLabels = useAppTranslation(DashboardAccountingExpenses);
  const runExport = useExpensesCsvExport(month, currency);
  const [exporting, setExporting] = useState(false);
  const [carryoverId, setCarryoverId] = useState<string | null>(null);

  const handleOpenCarryover = useCallback((sourceEntityId: string) => setCarryoverId(sourceEntityId), []);
  const handleCloseCarryover = useCallback(() => setCarryoverId(null), []);

  const columns = useExpensesColumns({
    labels,
    typeLabels: expensesLabels,
    sourceLabels: expensesLabels.source,
    locale,
    onOpenCarryover: handleOpenCarryover,
  });

  const handleExportClick = useCallback(() => {
    const run = async () => {
      setExporting(true);
      const outcome = await runExport();
      setExporting(false);
      if (outcome?.truncated) {
        logger.warn("Expenses CSV export truncated at the server row ceiling");
      }
    };
    void run();
  }, [runExport]);

  const handleRowClick = useCallback(
    (row: ProfitLossExpenseRow) => {
      if (row.id !== null) {
        router.push(`/accounting/expenses/${row.id}`);
      }
    },
    [router]
  );

  const handleGridRowClick = useCallback(
    (params: GridRowParams<ProfitLossExpenseRow>) => {
      handleRowClick(params.row);
    },
    [handleRowClick]
  );

  const expensesPageIndex = useProfitLossFilterStore(state => state.expensesPage);

  return (
    <Box component="section" aria-label={labels.tab.expenses} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <AppDataGrid<ProfitLossExpenseRow>
        rows={[...expensesPage.rows]}
        columns={columns}
        getRowId={row => row.id ?? ""}
        onRowClick={handleGridRowClick}
        loading={isLoading}
        emptyMessage={labels.empty.description}
        paginationOptions={buildServerPaginationOptions({
          page: expensesPageIndex,
          pageSize,
          totalCount: expensesPage.totalCount,
          onPageChange: onExpensesPageChange,
        })}
      />
      <ExpensesTabFooter
        labels={labels}
        typeLabels={expensesLabels}
        currency={currency}
        expensesPage={expensesPage}
        exporting={exporting}
        isLoading={isLoading}
        onExport={handleExportClick}
      />
      <CarryoverDetailDrawer
        carryoverId={carryoverId ?? ""}
        open={carryoverId !== null}
        onClose={handleCloseCarryover}
      />
    </Box>
  );
}
