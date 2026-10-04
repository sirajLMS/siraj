"use client";

import type { GridColDef } from "@mui/x-data-grid";
import type { ReportsDataGridLabels } from "@/frontend/common/views/dashboard/reports/types/reportsLabelTypes";
import type {
  ReportLedgerRow,
  ReportPaidAmount,
  ReportType,
} from "@/frontend/common/views/dashboard/reports/types/reportsTypes";
import { reportNameHrefForRow } from "@/frontend/common/views/dashboard/reports/utils/reportNameHrefForRow.utils";
import { DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui";
import {
  ReportsCountCell,
  ReportsHoursCell,
  ReportsPaidAmountsCell,
} from "@/frontend/desktop/views/dashboard/reports/components/reportsDataGridCells.desktop.parts";

interface BuildReportsDataGridColumnsParams {
  readonly labels: ReportsDataGridLabels;
  readonly reportType: ReportType;
  readonly showFinancials: boolean;
  readonly formatPaidAmounts: (paidAmounts: readonly ReportPaidAmount[]) => string;
}

export function buildReportsDataGridColumns({
  labels,
  reportType,
  showFinancials,
  formatPaidAmounts,
}: Readonly<BuildReportsDataGridColumnsParams>): GridColDef<ReportLedgerRow>[] {
  const cols: GridColDef<ReportLedgerRow>[] = [
    {
      field: "name",
      headerName: labels.name,
      flex: 1.4,
      minWidth: 200,
      renderCell: ({ row }) => (
        <DesktopPersonProfileLinkCell
          name={row.name}
          href={reportNameHrefForRow(row, reportType)}
          fallbackInitial={row.avatarInitials}
          avatarSize={32}
          fontWeight={600}
        />
      ),
    },
    {
      field: "taken",
      headerName: labels.taken,
      width: 90,
      align: "center",
      headerAlign: "center",
      renderCell: ({ row }) => <ReportsCountCell value={row.taken} tone="primary" />,
    },
    {
      field: "absent",
      headerName: labels.absent,
      width: 90,
      align: "center",
      headerAlign: "center",
      renderCell: ({ row }) => <ReportsCountCell value={row.absent} tone="error" />,
    },
    {
      field: "leave",
      headerName: labels.leave,
      width: 90,
      align: "center",
      headerAlign: "center",
      renderCell: ({ row }) => <ReportsCountCell value={row.leave} />,
    },
    {
      field: "pending",
      headerName: labels.pending,
      width: 100,
      align: "center",
      headerAlign: "center",
      renderCell: ({ row }) => <ReportsCountCell value={row.pending} />,
    },
  ];

  if (showFinancials) {
    cols.push(
      {
        field: "hours",
        headerName: labels.hours,
        width: 100,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => <ReportsHoursCell value={row.hours} />,
      },
      {
        field: "paidAmounts",
        headerName: labels.paid,
        flex: 1,
        minWidth: 180,
        align: "right",
        headerAlign: "right",
        sortable: false,
        renderCell: ({ row }) => <ReportsPaidAmountsCell text={formatPaidAmounts(row.paidAmounts)} />,
      }
    );
  }

  return cols;
}
