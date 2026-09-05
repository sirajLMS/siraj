"use client";

import { Box } from "@mui/material";
import { SessionAuditDataGrid } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditDataGrid";
import { SessionAuditFilterBar } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditFilterBar";
import type { SessionAuditReportsViewProps } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditReportsContainer";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

/**
 * Desktop layout of the Session Audit Reports page: the page header owns the
 * single title and the CSV export action, the report panel's header row
 * carries the filters, and the grid with its aggregate footer fills the panel
 * body. The grid owns its loading/empty/error states.
 */
export function SessionAuditReportsDesktopView(props: Readonly<SessionAuditReportsViewProps>) {
  const { exportAction, ...reportProps } = props;
  const { labels } = props;

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.title} actions={exportAction} />
      <DesktopSectionPanel actions={<SessionAuditFilterBar {...props} />} contentPadding={false} sx={{ mt: 3 }}>
        <Box sx={{ width: "100%", p: 2 }}>
          <SessionAuditDataGrid {...reportProps} />
        </Box>
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
