"use client";

import { Stack } from "@mui/material";
import { MobileListCardSkeletons } from "@/frontend/common/views/dashboard/accounting/components/__shared__/mobileListStateShared";
import { ExpensesTab } from "@/frontend/common/views/dashboard/accounting/profit-loss/ExpensesTab";
import { IncomePaymentsTab } from "@/frontend/common/views/dashboard/accounting/profit-loss/IncomePaymentsTab";
import { PaymentsTab } from "@/frontend/common/views/dashboard/accounting/profit-loss/PaymentsTab";
import type { ProfitLossDashboardViewProps } from "@/frontend/common/views/dashboard/accounting/profit-loss/ProfitLossDashboard";
import { ProfitsTab } from "@/frontend/common/views/dashboard/accounting/profit-loss/ProfitsTab";
import { MobileContentInset, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";

/** Height of each placeholder card while the first page loads. */
const LIST_SKELETON_HEIGHT = 112;

/**
 * Mobile layout of the profit & loss dashboard: the active tab's content
 * under the page header, inset from the edge-to-edge shell. The filter bar
 * and scrollable tab strip live in the shared shell above this view, which
 * also renders the empty-month panel and the load-error state — this view
 * only adds the first-load skeleton while the report has no rows yet.
 */
export function ProfitLossMobileView(props: Readonly<ProfitLossDashboardViewProps>) {
  const { labels, activeTab, isLoading } = props;
  const hasAnyRow =
    props.paymentsPage.totalCount > 0 || props.expensesPage.totalCount > 0 || props.incomePage.totalCount > 0;

  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.title} />
      <Stack sx={{ gap: 2, pb: 4 }}>
        <MobileContentInset>
          {isLoading && !hasAnyRow ? (
            <MobileListCardSkeletons height={LIST_SKELETON_HEIGHT} />
          ) : (
            <>
              {activeTab === "payments" ? <PaymentsTab {...props} /> : null}
              {activeTab === "expenses" ? <ExpensesTab {...props} /> : null}
              {activeTab === "income" ? <IncomePaymentsTab {...props} /> : null}
              {activeTab === "profits" ? <ProfitsTab {...props} /> : null}
            </>
          )}
        </MobileContentInset>
      </Stack>
    </MobilePageContainer>
  );
}
