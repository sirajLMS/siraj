"use client";

import { Box } from "@mui/material";
import type { LedgerStatus, ReportLedgerRow } from "@/frontend/views/dashboard/reports/types/reportsTypes";
import { PerformanceLedgerCard } from "@/frontend/views/dashboard/reports/components/PerformanceLedgerCard";

interface PerformanceLedgerCardListLabels {
  readonly studentLabel: string;
  readonly paid: string;
  readonly statusLabels: Record<LedgerStatus, string>;
  readonly taken: string;
  readonly absent: string;
  readonly leave: string;
  readonly pending: string;
  readonly hours: string;
}

interface PerformanceLedgerCardListProps {
  readonly rows: readonly ReportLedgerRow[];
  readonly labels: PerformanceLedgerCardListLabels;
  readonly onRowClick?: (row: ReportLedgerRow) => void;
}

export function PerformanceLedgerCardList({ rows, labels, onRowClick }: Readonly<PerformanceLedgerCardListProps>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {rows.map(row => (
        <PerformanceLedgerCard key={row.id} row={row} labels={labels} onClick={onRowClick} />
      ))}
    </Box>
  );
}
