"use client";

import { Box } from "@mui/material";
import type { PerformanceLedgerCardLabels } from "@/frontend/common/views/dashboard/reports/types/reportsLabelTypes";
import type { PerformanceLedgerCardListProps } from "@/frontend/common/views/dashboard/reports/types/reportsViewProps";
import {
  PerformanceLedgerCardDesktop,
  type PerformanceLedgerCardDesktopLabels,
} from "@/frontend/desktop/views/dashboard/reports/components/performanceLedgerCard.desktop";

export type PerformanceLedgerCardListDesktopLabels = PerformanceLedgerCardLabels;

export function PerformanceLedgerCardListDesktop({
  rows,
  labels,
  loading = false,
  onRowClick,
  showFinancials,
  formatPaidAmounts,
}: Readonly<PerformanceLedgerCardListProps>) {
  if (loading && rows.length === 0) {
    return null;
  }
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
        gap: 1.5,
      }}
    >
      {rows.map(row => (
        <PerformanceLedgerCardDesktop
          key={row.id}
          row={row}
          labels={labels as PerformanceLedgerCardDesktopLabels}
          showFinancials={showFinancials}
          paidLabel={formatPaidAmounts(row.paidAmounts)}
          onClick={onRowClick}
        />
      ))}
    </Box>
  );
}
