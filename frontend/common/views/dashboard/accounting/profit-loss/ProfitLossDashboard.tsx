"use client";

import { Box, Tab, Tabs } from "@mui/material";
import { useCallback } from "react";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { ErrorState } from "@/frontend/common/components/ui/state";
import { PROFIT_LOSS_TABS, type ProfitLossTab } from "@/frontend/common/stores/profitLossFilterStore";
import { EmptyMonthState } from "@/frontend/common/views/dashboard/accounting/profit-loss/EmptyMonthState";
import { GlobalFilterBar } from "@/frontend/common/views/dashboard/accounting/profit-loss/GlobalFilterBar";
import {
  type ProfitLossViewModel,
  useProfitLossViewModel,
} from "@/frontend/common/views/dashboard/accounting/profit-loss/useProfitLossViewModel";

/** Props both responsive tier views render the dashboard from. */
export type ProfitLossDashboardViewProps = ProfitLossViewModel;

const lazyViews = createLazyView<ProfitLossDashboardViewProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/accounting/profit-loss/profitLoss.mobile").then(m => ({
      default: m.ProfitLossMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/accounting/profit-loss/profitLoss.desktop").then(m => ({
      default: m.ProfitLossDesktopView,
    }))
);

/** Tab ids in sidebar order, keyed by the persisted active-tab value. */
const TAB_VALUES: readonly ProfitLossTab[] = PROFIT_LOSS_TABS;

/** Tab content for the active tab: the report body, first-load error, or the empty-month panel. */
function renderTabBody(viewModel: ProfitLossViewModel): React.ReactNode {
  const { isLoading, error, isEmptyMonth, refetch } = viewModel;
  if (error !== null && !isLoading) return <ErrorState onRetry={refetch} />;
  if (isEmptyMonth && !isLoading) return <EmptyMonthState />;
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}

/**
 * Composition root of the profit & loss dashboard: the global filter bar
 * (month + currency + FX warning chip) above the four report tabs, with the
 * active tab's content rendered by the responsive tier view. A single
 * multi-tab query feeds every tab, so switching tabs re-renders from the
 * same payload without another network call. The empty-month panel replaces
 * the tab content when the selected month has no rows anywhere.
 */
export function ProfitLossDashboard() {
  const viewModel = useProfitLossViewModel({});
  const { labels, activeTab, onTabChange } = viewModel;

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent, nextTab: string) => {
      const tab = TAB_VALUES.find(value => value === nextTab);
      if (tab !== undefined) onTabChange(tab);
    },
    [onTabChange]
  );

  const tabLabels: Record<ProfitLossTab, string> = {
    payments: labels.tab.payments,
    expenses: labels.tab.expenses,
    income: labels.tab.incomePayments,
    profits: labels.tab.profits,
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <GlobalFilterBar fxWarnings={viewModel.fxWarnings} />
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        aria-label={labels.title}
        variant="scrollable"
        allowScrollButtonsMobile
      >
        {TAB_VALUES.map(tab => (
          <Tab key={tab} value={tab} label={tabLabels[tab]} />
        ))}
      </Tabs>
      {renderTabBody(viewModel)}
    </Box>
  );
}
