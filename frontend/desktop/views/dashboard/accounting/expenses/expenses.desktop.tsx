"use client";

import { Box } from "@mui/material";
import { DesktopListStateGate } from "@/frontend/common/views/dashboard/accounting/components/DesktopListStateGate";
import { ExpenseFilterBar } from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseFilterBar";
import type { ExpensesViewProps } from "@/frontend/common/views/dashboard/accounting/expenses/ExpensesContainer";
import { ExpensesDataGrid } from "@/frontend/common/views/dashboard/accounting/expenses/ExpensesDataGrid";
import { usePageBreadcrumbs } from "@/frontend/common/views/dashboard/lib/usePageBreadcrumbs";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

/**
 * Desktop layout of the expense ledger page: the page header owns the single
 * title and the parent-only breadcrumb trail; the filter card spans the content
 * width between the header and the list panel, which holds the data grid (with
 * its toolbar and aggregate footer) without a repeated title.
 */
export function ExpensesDesktopView(props: Readonly<ExpensesViewProps>) {
  const { labels, rows, isLoading, error } = props;
  // The auto-walked trail ends with this page's own nav entry, which duplicates
  // the H1 — drop the trailing crumb so the trail carries only the parent path.
  const crumbs = usePageBreadcrumbs();
  const breadcrumbs = crumbs.length > 0 ? crumbs.slice(0, -1) : crumbs;

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.title} breadcrumbs={breadcrumbs} />
      <ExpenseFilterBar />
      <DesktopSectionPanel contentPadding={false}>
        <DesktopListStateGate
          error={error !== null}
          loading={isLoading}
          hasRows={rows.length > 0}
          errorMessage={labels.loadError}
        >
          <Box sx={{ width: "100%", p: 2 }}>
            <ExpensesDataGrid {...props} />
          </Box>
        </DesktopListStateGate>
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
