"use client";

import { DesktopListStateGate } from "@/frontend/common/views/dashboard/accounting/components/DesktopListStateGate";
import type { PayrollReportsViewProps } from "@/frontend/common/views/dashboard/accounting/payroll/PayrollReportsContainer";
import { PayrollReportsDataGrid } from "@/frontend/common/views/dashboard/accounting/payroll/PayrollReportsDataGrid";
import { PayrollReportsFilterBar } from "@/frontend/common/views/dashboard/accounting/payroll/PayrollReportsFilterBar";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

/**
 * Desktop layout of the Payroll Reports page: filters live in the report
 * panel's header row, the grid and its aggregate footer fill the panel body.
 */
export function PayrollReportsDesktopView(props: Readonly<PayrollReportsViewProps>) {
  const { labels, rows, loading, error } = props;

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.title} />
      <DesktopSectionPanel title={labels.title} actions={<PayrollReportsFilterBar {...props} />} contentPadding={false}>
        <DesktopListStateGate error={error} loading={loading} hasRows={rows.length > 0} errorMessage={labels.loadError}>
          <PayrollReportsDataGrid {...props} />
        </DesktopListStateGate>
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
