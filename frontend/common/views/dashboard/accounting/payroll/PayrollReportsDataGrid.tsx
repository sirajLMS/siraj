"use client";

import { FileDownloadOutlined } from "@mui/icons-material";
import { Box, Button, Stack, Tooltip, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback, useMemo, useState } from "react";
import { ExportButton, SectionPanel, StatusBadge } from "@/frontend/common/components/ui";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { CalculationStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { PAGE_SIZE_OPTIONS } from "@/frontend/common/stores/payrollReportsFilterStore";
import {
  dateCell,
  formatAccountingDate,
  formatAccountingMoney,
  numericCell,
  textCell,
} from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import type {
  PayrollReportAggregates,
  PayrollReportRow,
  PayrollReportsViewModel,
} from "@/frontend/common/views/dashboard/accounting/payroll/usePayrollReportsViewModel";
import type { PayrollLabels } from "@/shared/locale/types/dashboard/billing/payroll";

/** Toast duration for the CSV export outcome notices. */
const EXPORT_TOAST_DURATION_MS = 5000;

const MS_PER_MINUTE = 60_000;

/**
 * View-model slice the payroll report grid renders from, plus the override
 * dialog opener. The override action only renders for operators holding the
 * payroll manage permission (`canManagePayroll`).
 */
export type PayrollReportsDataGridProps = Pick<
  PayrollReportsViewModel,
  | "labels"
  | "statusLabels"
  | "rows"
  | "loading"
  | "totalCount"
  | "page"
  | "pageSize"
  | "onPageChange"
  | "onPageSizeChange"
  | "aggregates"
  | "canManagePayroll"
  | "onExportCsv"
> & {
  readonly onOverride: (row: PayrollReportRow) => void;
};

interface PayrollReportColumnArgs {
  readonly labels: PayrollLabels;
  readonly statusLabels: Record<CalculationStatus, string>;
  readonly locale: string;
  readonly canManagePayroll: boolean;
  readonly onOverride: (row: PayrollReportRow) => void;
}

/** Taught minutes between the recorded actual timestamps; null when either side is missing. */
function actualDurationMinutes(row: PayrollReportRow): number | null {
  if (row.actualStartAt === null || row.actualEndAt === null) return null;
  const startMs = new Date(row.actualStartAt).getTime();
  const endMs = new Date(row.actualEndAt).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return null;
  return Math.max(0, Math.round((endMs - startMs) / MS_PER_MINUTE));
}

/** One-line note preview with the full text on hover; em-dash when unnotated. */
function renderNoteCell(note: string | null): React.ReactNode {
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

function buildPayrollReportColumns({
  labels,
  statusLabels,
  locale,
  canManagePayroll,
  onOverride,
}: PayrollReportColumnArgs): GridColDef<PayrollReportRow>[] {
  const columns: GridColDef<PayrollReportRow>[] = [
    {
      field: "scheduledStartAt",
      headerName: labels.column.scheduledStart,
      width: 150,
      valueFormatter: value => formatAccountingDate(dateCell(value), locale),
    },
    {
      field: "teacherName",
      headerName: labels.filters.teacher,
      flex: 1,
      minWidth: 150,
      valueFormatter: value => textCell(value),
    },
    {
      field: "studentName",
      headerName: labels.filters.student,
      flex: 1,
      minWidth: 150,
      valueFormatter: value => textCell(value),
    },
    {
      field: "subjectName",
      headerName: labels.column.subject,
      flex: 1,
      minWidth: 130,
      valueFormatter: value => textCell(value),
    },
    {
      field: "scheduledDurationMinutes",
      headerName: labels.column.scheduledDuration,
      width: 140,
      align: "right",
      headerAlign: "right",
      valueFormatter: value => (value == null ? "—" : String(numericCell(value))),
    },
    {
      field: "actualDuration",
      headerName: labels.column.actualDuration,
      width: 140,
      align: "right",
      headerAlign: "right",
      valueGetter: (_value, row) => actualDurationMinutes(row),
      valueFormatter: value => (value == null ? "—" : String(value)),
    },
    {
      field: "calculatedDuration",
      headerName: labels.column.calculatedDuration,
      width: 150,
      align: "right",
      headerAlign: "right",
      valueFormatter: value => (value == null ? "—" : String(numericCell(value))),
    },
    {
      field: "teacherPaidAmount",
      headerName: labels.column.paidAmount,
      width: 150,
      align: "right",
      headerAlign: "right",
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "baseline" }}>
          <Box component="span" sx={{ fontWeight: 600 }}>
            {formatAccountingMoney(row.teacherPaidAmount)}
          </Box>
          {row.teacherPaidCurrency !== null ? (
            <Box component="span" sx={theme => ({ color: theme.palette.onSurfaceVariant, fontSize: 12 })}>
              {row.teacherPaidCurrency}
            </Box>
          ) : null}
        </Stack>
      ),
    },
    {
      field: "calculationStatus",
      headerName: labels.column.status,
      width: 140,
      renderCell: ({ row }) =>
        row.calculationStatus === null ? (
          "—"
        ) : (
          <StatusBadge
            category="payrollCalculation"
            status={row.calculationStatus}
            label={statusLabels[row.calculationStatus]}
          />
        ),
    },
    {
      field: "isPartialPercentage",
      headerName: labels.column.partialPercentage,
      width: 110,
      align: "right",
      headerAlign: "right",
      valueFormatter: value => (value == null ? "—" : `${numericCell(value)}%`),
    },
    {
      field: "payrollNote",
      headerName: labels.column.note,
      flex: 1,
      minWidth: 160,
      sortable: false,
      renderCell: ({ row }) => renderNoteCell(row.payrollNote),
    },
  ];
  if (canManagePayroll) {
    columns.push({
      field: "actions",
      headerName: labels.column.actions,
      width: 130,
      sortable: false,
      renderCell: ({ row }) => (
        <Button size="small" variant="outlined" onClick={() => onOverride(row)}>
          {labels.override.action}
        </Button>
      ),
    });
  }
  return columns;
}

interface AggregateFooterProps {
  readonly aggregates: PayrollReportAggregates;
  readonly labels: PayrollLabels;
  readonly statusLabels: Record<CalculationStatus, string>;
}

/** Aggregate summary card under the grid: total paid amount plus per-status row counts. */
function AggregateFooter({ aggregates, labels, statusLabels }: Readonly<AggregateFooterProps>) {
  return (
    <SectionPanel>
      <Stack
        direction={{ xs: "column", md: "row" }}
        sx={{
          flexWrap: "wrap",
          gap: 3,
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
        }}
      >
        <Stack sx={{ gap: 0.5 }}>
          <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.aggregate.totalPaid}
          </Typography>
          <Stack direction="row" sx={{ alignItems: "baseline", gap: 1 }}>
            <Typography variant="titleLg">{formatAccountingMoney(aggregates.totalPaidAmount)}</Typography>
            {aggregates.totalPaidCurrency !== null ? (
              <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {aggregates.totalPaidCurrency}
              </Typography>
            ) : null}
          </Stack>
        </Stack>
        <Stack sx={{ gap: 0.5 }}>
          <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.aggregate.rowCount}
          </Typography>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1.5 }}>
            {Object.values(CalculationStatus).map(status => (
              <Stack key={status} direction="row" sx={{ alignItems: "center", gap: 0.5 }}>
                <StatusBadge category="payrollCalculation" status={status} label={statusLabels[status]} />
                <Typography variant="bodyMd">{aggregates.rowCountByStatus[status]}</Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </SectionPanel>
  );
}

export function PayrollReportsDataGrid({
  labels,
  statusLabels,
  rows,
  loading,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  aggregates,
  canManagePayroll,
  onExportCsv,
  onOverride,
}: Readonly<PayrollReportsDataGridProps>) {
  const locale = useAppLocale();
  const notifications = useNotifications();
  const [exporting, setExporting] = useState(false);

  const columns = useMemo<GridColDef<PayrollReportRow>[]>(
    () => buildPayrollReportColumns({ labels, statusLabels, locale, canManagePayroll, onOverride }),
    [labels, statusLabels, locale, canManagePayroll, onOverride]
  );

  /**
   * Runs the filtered CSV download and surfaces its outcome: a failure toast
   * when the download itself failed, and the truncation notice when the
   * server capped the export at its row ceiling. The view-model handler
   * never rejects (failures resolve to null), so the busy flag always clears.
   */
  const handleExportCsv = useCallback(async () => {
    setExporting(true);
    const outcome = await onExportCsv();
    setExporting(false);
    if (outcome === null) {
      notifications.show(labels.exportFailed, {
        severity: "error",
        autoHideDuration: EXPORT_TOAST_DURATION_MS,
      });
      return;
    }
    if (outcome.truncated) {
      notifications.show(labels.exportTruncated, {
        severity: "warning",
        autoHideDuration: EXPORT_TOAST_DURATION_MS,
      });
    }
  }, [labels, notifications, onExportCsv]);

  return (
    <Stack sx={{ gap: 1.5, width: "100%" }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <ExportButton
          id="payroll-reports-export-csv"
          startIcon={<FileDownloadOutlined />}
          disabled={exporting}
          onClick={() => {
            void handleExportCsv();
          }}
        >
          {labels.exportCsv}
        </ExportButton>
      </Box>
      <AppDataGrid<PayrollReportRow>
        rows={rows}
        columns={columns}
        loading={loading}
        getRowId={row => row.instanceId ?? row.id ?? ""}
        emptyMessage={labels.empty}
        ariaLabel={labels.title}
        disableColumnMenu
        paginationOptions={buildServerPaginationOptions({
          page,
          pageSize,
          totalCount,
          onPageChange,
          onPageSizeChange,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
        })}
      />
      <AggregateFooter aggregates={aggregates} labels={labels} statusLabels={statusLabels} />
    </Stack>
  );
}
