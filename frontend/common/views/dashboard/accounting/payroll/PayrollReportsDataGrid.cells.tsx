"use client";

import { Box, Button, Stack, Tooltip } from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import type { ReactNode } from "react";
import { StatusBadge } from "@/frontend/common/components/ui";
import type { CalculationStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { formatAccountingMoney } from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import type { PayrollReportRow } from "@/frontend/common/views/dashboard/accounting/payroll/usePayrollReportsViewModel";
import type { PayrollLabels } from "@/shared/locale/types/dashboard/billing/payroll";

const MS_PER_MINUTE = 60_000;

/** Taught minutes between the recorded actual timestamps; null when either side is missing. */
export function actualDurationMinutes(row: PayrollReportRow): number | null {
  if (row.actualStartAt === null || row.actualEndAt === null) return null;
  const startMs = new Date(row.actualStartAt).getTime();
  const endMs = new Date(row.actualEndAt).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return null;
  return Math.max(0, Math.round((endMs - startMs) / MS_PER_MINUTE));
}

/** One-line note preview with the full text on hover; em-dash when unnotated. */
export function renderNoteCell(note: string | null): ReactNode {
  return note === null ? (
    "—"
  ) : (
    <Tooltip title={note}>
      <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {note}
      </Box>
    </Tooltip>
  );
}

/** Paid amount with its currency qualifier stacked at the baseline. */
export function renderPaidAmountCell({ row }: GridRenderCellParams<PayrollReportRow>) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: "baseline" }}>
      <Box component="span" sx={{ fontWeight: 600 }}>
        {formatAccountingMoney(row.teacherPaidAmount)}
      </Box>
      {row.teacherPaidCurrency !== null ? (
        <Box
          component="span"
          sx={theme => ({ color: theme.palette.onSurfaceVariant, fontSize: theme.typography.caption.fontSize })}
        >
          {row.teacherPaidCurrency}
        </Box>
      ) : null}
    </Stack>
  );
}

/** Status chip cell bound to the localized status labels for one grid. */
export function renderCalculationStatusCell(
  { row }: GridRenderCellParams<PayrollReportRow>,
  statusLabels: Record<CalculationStatus, string>
) {
  return row.calculationStatus === null ? (
    "—"
  ) : (
    <StatusBadge
      category="payrollCalculation"
      status={row.calculationStatus}
      label={statusLabels[row.calculationStatus]}
    />
  );
}

/** Trailing override action column, rendered only for payroll-manage operators. */
export function buildOverrideActionColumn(
  labels: PayrollLabels,
  onOverride: (row: PayrollReportRow) => void
): GridColDef<PayrollReportRow> {
  return {
    field: "actions",
    headerName: labels.column.actions,
    width: 130,
    sortable: false,
    renderCell: ({ row }) => (
      <Button size="small" variant="outlined" onClick={() => onOverride(row)}>
        {labels.override.action}
      </Button>
    ),
  };
}
