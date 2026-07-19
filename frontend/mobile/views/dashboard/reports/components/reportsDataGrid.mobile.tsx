"use client";

import { Box } from "@mui/material";
import type {
  PerformanceLedgerCardLabels,
  ReportsDataGridLabels,
} from "@/frontend/common/views/dashboard/reports/types/reportsLabelTypes";
import type { ReportsDataGridProps } from "@/frontend/common/views/dashboard/reports/types/reportsViewProps";
import { reportNameHrefForRow } from "@/frontend/common/views/dashboard/reports/utils/reportNameHrefForRow.utils";
import { MobileCardList, MobileCardListItem } from "@/frontend/mobile/components/ui";
import {
  PerformanceLedgerCardMobile,
  type PerformanceLedgerCardMobileLabels,
} from "@/frontend/mobile/views/dashboard/reports/components/performanceLedgerCard.mobile";

export type ReportsDataGridMobileLabels = ReportsDataGridLabels;

export function ReportsDataGridMobile({
  rows,
  labels,
  reportType,
  loading = false,
  onRowClick,
  showFinancials,
  formatPaidAmounts,
}: Readonly<ReportsDataGridProps>) {
  // The data-grid labels shape differs from the ledger-card labels shape; map
  // only the labels the card actually renders. Status labels escape mapping
  // here because the mobile data grid is invoked from the parent view that
  // has not yet decided how to surface status text — the parent passes the
  // full `PerformanceLedgerCardLabels` via the `ReportsViewModel.labels.ledgerLabels`
  // field for the canonical path; this component only renders a card-only
  // fallback when used standalone.
  const ledgerLabels = {
    studentLabel: () => "",
    paid: labels.paid,
    statusLabels: {} as never,
    taken: labels.taken,
    absent: labels.absent,
    leave: labels.leave,
    pending: labels.pending,
    hours: labels.hours,
  } as PerformanceLedgerCardLabels as PerformanceLedgerCardMobileLabels;

  return (
    <Box sx={{ px: { xs: 0 }, pb: 1 }}>
      <MobileCardList<(typeof rows)[number]>
        rows={rows}
        getKey={row => row.id}
        loading={loading}
        emptyMessage={labels.noEntries}
        gap={2}
        paginationOptions={{ mode: "client" }}
        renderItem={row => {
          const href = reportNameHrefForRow(row, reportType);
          return (
            <MobileCardListItem
              key={row.id}
              interactive={Boolean(onRowClick)}
              {...(href ? { accentBorder: { color: "primary", side: "inline-start", width: 4 } } : {})}
            >
              <PerformanceLedgerCardMobile
                row={row}
                labels={ledgerLabels}
                showFinancials={showFinancials}
                paidLabel={formatPaidAmounts(row.paidAmounts)}
                onClick={onRowClick}
              />
            </MobileCardListItem>
          );
        }}
      />
    </Box>
  );
}
