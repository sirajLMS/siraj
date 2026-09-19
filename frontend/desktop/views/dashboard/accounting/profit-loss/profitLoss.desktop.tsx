"use client";

import { DesktopListStateGate } from "@/frontend/common/views/dashboard/accounting/components/DesktopListStateGate";
import { ExpensesTab } from "@/frontend/common/views/dashboard/accounting/profit-loss/ExpensesTab";
import { IncomePaymentsTab } from "@/frontend/common/views/dashboard/accounting/profit-loss/IncomePaymentsTab";
import { PaymentsTab } from "@/frontend/common/views/dashboard/accounting/profit-loss/PaymentsTab";
import type { ProfitLossDashboardViewProps } from "@/frontend/common/views/dashboard/accounting/profit-loss/ProfitLossDashboard";
import { ProfitsTab } from "@/frontend/common/views/dashboard/accounting/profit-loss/ProfitsTab";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

/**
 * Desktop layout of the profit & loss dashboard: the active tab's content
 * fills a report panel under the page header. The filter bar and tab strip
 * live in the shared shell above this view, which also renders the
 * empty-month panel and the load-error state — this view only adds the
 * first-load spinner while the report has no rows yet.
 */
export function ProfitLossDesktopView(props: Readonly<ProfitLossDashboardViewProps>) {
  const { labels, activeTab, isLoading } = props;
  const hasAnyRow =
    props.paymentsPage.totalCount > 0 || props.expensesPage.totalCount > 0 || props.incomePage.totalCount > 0;

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.title} />
      <DesktopSectionPanel contentPadding={false}>
        <DesktopListStateGate error={false} loading={isLoading && !hasAnyRow} hasRows={hasAnyRow} errorMessage="">
          {activeTab === "payments" ? <PaymentsTab {...props} /> : null}
          {activeTab === "expenses" ? <ExpensesTab {...props} /> : null}
          {activeTab === "income" ? <IncomePaymentsTab {...props} /> : null}
          {activeTab === "profits" ? <ProfitsTab {...props} /> : null}
        </DesktopListStateGate>
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
