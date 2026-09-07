"use client";

import { Stack } from "@mui/material";
import { SessionAuditDataGrid } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditDataGrid";
import { SessionAuditFilterBar } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditFilterBar";
import type { SessionAuditReportsViewProps } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditReportsContainer";
import { MobileContentInset, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";

/**
 * Mobile layout of the Session Audit Reports page: the page header owns the
 * single title and the CSV export action (rendered full-width), the filter
 * controls stack above the report grid, which scrolls horizontally for its
 * wide audit columns. The grid owns its loading/empty/error states.
 */
export function SessionAuditReportsMobileView(props: Readonly<SessionAuditReportsViewProps>) {
  const { exportAction, ...reportProps } = props;
  const { labels } = props;

  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.title} breadcrumbs={[]} actions={exportAction} />
      <Stack sx={{ gap: 2, pb: 4 }}>
        <MobileContentInset>
          <SessionAuditFilterBar {...props} />
        </MobileContentInset>
        <MobileContentInset>
          <SessionAuditDataGrid {...reportProps} />
        </MobileContentInset>
      </Stack>
    </MobilePageContainer>
  );
}
