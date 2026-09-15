"use client";

import { Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import type { ReactElement } from "react";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import {
  formatDate,
  formatDelta,
} from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceLedger.utils";
import { getLedgerReasonLabel } from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceStatus.utils";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

interface LedgerEntry {
  readonly id: string | null;
  readonly delta: number | null;
  readonly reason: string | null;
  readonly createdAt: string | null;
}

export interface LedgerEntriesListProps {
  readonly entries: ReadonlyArray<LedgerEntry>;
  readonly t: StudentQuotaLabels;
}

function buildLedgerColumns(t: StudentQuotaLabels): GridColDef<LedgerEntry>[] {
  return [
    {
      field: "reason",
      headerName: t.audience.reason,
      flex: 1.5,
      minWidth: 140,
      renderCell: params => (
        <Typography variant="bodyMd" sx={{ fontWeight: 500 }}>
          {getLedgerReasonLabel(params.value, t)}
        </Typography>
      ),
    },
    {
      field: "createdAt",
      headerName: t.audience.ledgerDate,
      flex: 1,
      minWidth: 120,
      renderCell: params => formatDate(params.value),
    },
    {
      field: "delta",
      headerName: t.audience.delta,
      type: "number",
      flex: 0.8,
      minWidth: 100,
      renderCell: params => (
        <Typography
          variant="bodyMd"
          sx={theme => ({
            fontWeight: 700,
            color: (params.value ?? 0) >= 0 ? theme.palette.success.main : theme.palette.error.main,
          })}
        >
          {formatDelta(params.value)}
        </Typography>
      ),
    },
  ];
}

export function LedgerEntriesList({ entries, t }: Readonly<LedgerEntriesListProps>): ReactElement {
  return (
    <AppDataGrid
      rows={entries}
      columns={buildLedgerColumns(t)}
      ariaLabel={t.audience.recentLedgerEntries}
      emptyMessage={t.audience.noLedgerEntries}
      paginationOptions={{ mode: "client", pageSize: 5 }}
    />
  );
}
