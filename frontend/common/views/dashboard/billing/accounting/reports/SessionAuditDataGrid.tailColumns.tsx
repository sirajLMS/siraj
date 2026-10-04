import { OpenInNewOutlined } from "@mui/icons-material";
import { Box, IconButton, Tooltip } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import {
  formatDurationMinutes,
  formatPaidAmount,
  formatPartialPercentage,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/formatters/sessionAuditCellFormatters";
import { PayrollNotePopover } from "@/frontend/common/views/dashboard/billing/accounting/reports/PayrollNotePopover";
import {
  CalculationStatusCell,
  CarryoverLinkCell,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditDataGrid.cells";
import type { SessionAuditColumnArgs } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditDataGrid.types";
import type { SessionAuditReportRow } from "@/frontend/common/views/dashboard/billing/accounting/reports/useSessionAuditReportsViewModel";

type MetricColumnArgs = Pick<SessionAuditColumnArgs, "labels" | "payrollLabels" | "locale" | "calculationStatusLabels">;

function buildMetricColumns({
  labels,
  payrollLabels,
  locale,
  calculationStatusLabels,
}: MetricColumnArgs): GridColDef<SessionAuditReportRow>[] {
  return [
    {
      field: "durationMinutes",
      headerName: labels.column.durationAssumed,
      width: 100,
      align: "right",
      headerAlign: "right",
      valueFormatter: value => formatDurationMinutes(typeof value === "number" ? value : null, labels.cell),
    },
    {
      field: "calculatedDuration",
      headerName: labels.column.calculatedDuration,
      width: 104,
      align: "right",
      headerAlign: "right",
      // renderCell rather than valueFormatter: the grid skips the value
      // formatter for nullish values, which would leave an empty cell here
      // instead of the "not calculated" dash.
      renderCell: ({ row }) => <Box component="span">{formatDurationMinutes(row.calculatedDuration, labels.cell)}</Box>,
    },
    {
      field: "teacherPaidAmount",
      headerName: labels.column.paidAmount,
      // The localized header wraps onto two lines; the fixed width must keep
      // the longer word entire even while a sort direction icon holds room in
      // the header, otherwise the truncated ellipsis reads as clipped copy.
      width: 108,
      minWidth: 108,
      align: "right",
      headerAlign: "right",
      renderCell: ({ row }) => (
        <Box component="span" dir="ltr" sx={{ fontWeight: 600, unicodeBidi: "isolate" }}>
          {formatPaidAmount(row.teacherPaidAmount, row.teacherPaidCurrency, locale, labels.cell)}
        </Box>
      ),
    },
    {
      field: "calculationStatus",
      headerName: labels.column.calculationStatus,
      width: 124,
      renderCell: ({ row }) => (
        <CalculationStatusCell
          status={row.calculationStatus}
          paymentDateIso={row.teacherDuePaymentDate}
          locale={locale}
          cellLabels={labels.cell}
          statusLabels={calculationStatusLabels}
        />
      ),
    },
    {
      field: "isPartialPercentage",
      headerName: payrollLabels.column.partialPercentage,
      width: 96,
      align: "right",
      headerAlign: "right",
      sortable: false,
      valueFormatter: value => formatPartialPercentage(typeof value === "number" ? value : null, locale, labels.cell),
    },
  ];
}

type TrailingColumnArgs = Pick<
  SessionAuditColumnArgs,
  "labels" | "payrollLabels" | "canManageReports" | "onOpenAuditOverride" | "onOpenCarryover"
>;

function buildTrailingColumns({
  labels,
  payrollLabels,
  canManageReports,
  onOpenAuditOverride,
  onOpenCarryover,
}: TrailingColumnArgs): GridColDef<SessionAuditReportRow>[] {
  const columns: GridColDef<SessionAuditReportRow>[] = [
    {
      field: "carryoverLink",
      headerName: labels.carryover.linkedColumn,
      width: 96,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: ({ row }) => (
        <CarryoverLinkCell
          carryoverBalanceId={row.carryoverBalanceId}
          chipLabel={labels.carryover.linkedChip}
          emptyText={labels.cell.notCalculated}
          onOpen={onOpenCarryover}
        />
      ),
    },
    {
      field: "payrollNote",
      headerName: labels.column.note,
      flex: 1,
      minWidth: 72,
      sortable: false,
      renderCell: ({ row }) => <PayrollNotePopover note={row.payrollNote} labels={labels.cell} />,
    },
  ];
  if (canManageReports) {
    columns.push({
      field: "actions",
      headerName: payrollLabels.column.actions,
      // The single-word localized header must fit whole; the cell body is a
      // single icon, so the wider header-driven floor keeps the column compact.
      width: 92,
      minWidth: 92,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: ({ row }) =>
        row.instanceId === null ? null : (
          <Tooltip title={labels.action.openAuditPage}>
            <IconButton size="small" aria-label={labels.action.openAuditPage} onClick={() => onOpenAuditOverride(row)}>
              <OpenInNewOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
    });
  }
  return columns;
}

export { buildMetricColumns, buildTrailingColumns };
