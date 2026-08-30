"use client";

import { Stack } from "@mui/material";
import { MobileListErrorNotice } from "@/frontend/common/views/dashboard/accounting/components/__shared__/mobileListStateShared";
import type { PayrollReportsViewProps } from "@/frontend/common/views/dashboard/accounting/payroll/PayrollReportsContainer";
import { PayrollReportsDataGrid } from "@/frontend/common/views/dashboard/accounting/payroll/PayrollReportsDataGrid";
import { PayrollReportsFilterBar } from "@/frontend/common/views/dashboard/accounting/payroll/PayrollReportsFilterBar";
import { MobileContentInset, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";

/**
 * Mobile layout of the Payroll Reports page: the filter controls stack above
 * the report grid, which scrolls horizontally for its wide audit columns.
 */
export function PayrollReportsMobileView(props: Readonly<PayrollReportsViewProps>) {
  const { labels, rows, error } = props;
  const reportFailed = error && rows.length === 0;

  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.title} />
      <Stack sx={{ gap: 2, pb: 4 }}>
        <MobileContentInset>
          <PayrollReportsFilterBar {...props} />
        </MobileContentInset>
        <MobileListErrorNotice visible={reportFailed} message={labels.loadError} />
        {reportFailed ? null : (
          <MobileContentInset>
            <PayrollReportsDataGrid {...props} />
          </MobileContentInset>
        )}
      </Stack>
    </MobilePageContainer>
  );
}
