import { Box } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { PersonNameCell } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditDataGrid.cells";
import {
  buildMetricColumns,
  buildTrailingColumns,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditDataGrid.tailColumns";
import {
  ScheduledStartCell,
  SessionTimeCell,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditDataGrid.timeCells";
import type { SessionAuditColumnArgs } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditDataGrid.types";
import { SessionAuditStatusChip } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditStatusChip";
import type { SessionAuditReportRow } from "@/frontend/common/views/dashboard/billing/accounting/reports/useSessionAuditReportsViewModel";
import type { SessionAuditLabels } from "@/shared/locale/types/dashboard/reports";

function buildTimeCellColumn(
  kind: "open" | "end",
  headerName: string,
  labels: SessionAuditLabels,
  locale: string
): GridColDef<SessionAuditReportRow> {
  return {
    field: kind === "open" ? "actualStartAt" : "actualEndAt",
    headerName,
    // The compact numeric-month date-time plus the localized "in progress" /
    // "not joined" placeholders need a little more room than the sorted-name
    // columns; the width also holds the sort direction icon without ellipsizing.
    width: 124,
    renderCell: ({ row }) => (
      <SessionTimeCell
        value={kind === "open" ? row.actualStartAt : row.actualEndAt}
        bookingTimezone={row.bookingTimezone}
        locale={locale}
        labels={labels}
        kind={kind}
        sessionStarted={row.actualStartAt !== null}
      />
    ),
  };
}

type LeadingColumnArgs = Pick<SessionAuditColumnArgs, "labels" | "payrollLabels" | "locale">;

function buildLeadingColumns({
  labels,
  payrollLabels,
  locale,
}: LeadingColumnArgs): GridColDef<SessionAuditReportRow>[] {
  return [
    {
      field: "scheduledStartAt",
      headerName: labels.column.scheduledStart,
      // The two-word header wraps onto two lines; below ~124px the sort icon
      // steals the room "SCHEDULED" needs and the header ellipsizes.
      width: 124,
      renderCell: ({ value }) => (
        <ScheduledStartCell value={value} locale={locale} fallback={labels.cell.notCalculated} />
      ),
    },
    {
      field: "teacherName",
      headerName: labels.filters.teacher,
      flex: 1.25,
      // Roomier name floor reclaims width from the numeric columns so full
      // names render without ellipsizing at default desktop widths.
      minWidth: 150,
      renderCell: ({ row }) => <PersonNameCell value={row.teacherName} />,
    },
    {
      field: "currentStatus",
      headerName: labels.filters.status,
      width: 124,
      sortable: false,
      renderCell: ({ row }) =>
        row.currentStatus === null ? (
          <Box component="span" sx={theme => ({ color: theme.palette.text.secondary })}>
            {labels.cell.notCalculated}
          </Box>
        ) : (
          <SessionAuditStatusChip
            status={row.currentStatus}
            labels={labels.status}
            actualStartAt={row.actualStartAt}
            actualEndAt={row.actualEndAt}
          />
        ),
    },
    {
      field: "studentName",
      headerName: labels.filters.student,
      flex: 1.25,
      minWidth: 150,
      renderCell: ({ row }) => <PersonNameCell value={row.studentName} />,
    },
    {
      field: "subjectName",
      headerName: payrollLabels.column.subject,
      flex: 1,
      minWidth: 104,
      sortable: false,
      renderCell: ({ row }) => <PersonNameCell value={row.subjectName} />,
    },
    buildTimeCellColumn("open", labels.column.openSessionTime, labels, locale),
    buildTimeCellColumn("end", labels.column.endSessionTime, labels, locale),
  ];
}

export function buildSessionAuditColumns(args: SessionAuditColumnArgs): GridColDef<SessionAuditReportRow>[] {
  return [...buildLeadingColumns(args), ...buildMetricColumns(args), ...buildTrailingColumns(args)];
}
