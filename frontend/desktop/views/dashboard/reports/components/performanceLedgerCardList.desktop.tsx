"use client";

import { Box } from "@mui/material";
import type { ReportLedgerRow } from "@/frontend/common/views/dashboard/reports/types/reportsTypes";
import {
  PerformanceLedgerCardDesktop,
  type PerformanceLedgerCardDesktopLabels,
} from "@/frontend/desktop/views/dashboard/reports/components/performanceLedgerCard.desktop";

interface PerformanceLedgerCardListDesktopProps {
  readonly rows: readonly ReportLedgerRow[];
  readonly labels: PerformanceLedgerCardDesktopLabels;
  readonly loading?: boolean;
  readonly onRowClick?: (row: ReportLedgerRow) => void;
}

export function PerformanceLedgerCardListDesktop({
  rows,
  labels,
  loading = false,
  onRowClick,
}: Readonly<PerformanceLedgerCardListDesktopProps>) {
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
        <PerformanceLedgerCardDesktop key={row.id} row={row} labels={labels} onClick={onRowClick} />
      ))}
    </Box>
  );
}
