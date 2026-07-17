"use client";

import { LinearProgress } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import type {
  TeacherDueRow,
  TeacherDuesViewModel,
} from "@/frontend/common/views/dashboard/supervisor/teacher-dues/types/teacherDuesTypes";
import { DesktopAppDataGrid, DesktopPrimaryPageAction, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

export function TeacherDuesDesktopView({
  rows,
  loading,
  markingPaid,
  selectedDueIds,
  labels,
  onMarkPaid,
  onSelectDues,
}: Readonly<TeacherDuesViewModel>) {
  const columns = useMemo<GridColDef<TeacherDueRow>[]>(
    () => [
      {
        field: "teacherId",
        headerName: labels.teacherNameColumn,
        flex: 1,
        minWidth: 150,
      },
      {
        field: "classInstanceId",
        headerName: labels.classDateColumn,
        flex: 1,
        minWidth: 150,
      },
      {
        field: "studentId",
        headerName: labels.studentColumn,
        flex: 1,
        minWidth: 150,
      },
      {
        field: "hours",
        headerName: labels.hoursColumn,
        width: 100,
      },
      {
        field: "amount",
        headerName: labels.amountColumn,
        width: 120,
        valueGetter: (_, row) => `${row.currency} ${row.amount}`,
      },
      {
        field: "currency",
        headerName: labels.currencyColumn,
        width: 100,
        valueGetter: (_, row) => row.currency ?? "",
      },
      {
        field: "status",
        headerName: labels.statusColumn,
        width: 130,
        renderCell: params => (
          <DesktopStatusBadge
            category="invoice"
            status={params.row.status ?? "PENDING"}
            label={params.row.status ?? "PENDING"}
          />
        ),
      },
      {
        field: "approvedAt",
        headerName: labels.approvedDateColumn,
        flex: 1,
        minWidth: 150,
        valueGetter: (_, row) => row.approvedAt || "-",
      },
      {
        field: "actions",
        headerName: labels.markAsPaidButton,
        width: 140,
        align: "center",
        headerAlign: "center",
        renderCell: params => (
          <DesktopPrimaryPageAction size="small" onClick={() => onMarkPaid([params.row.id])} disabled={markingPaid}>
            {labels.markAsPaidButton}
          </DesktopPrimaryPageAction>
        ),
      },
    ],
    [labels, markingPaid, onMarkPaid]
  );

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={labels.pageTitle}
        actions={
          selectedDueIds.length > 0 ? (
            <DesktopPrimaryPageAction onClick={() => onMarkPaid(selectedDueIds)} disabled={markingPaid}>
              {labels.markAsPaidButton}
            </DesktopPrimaryPageAction>
          ) : null
        }
      />

      {loading ? <LinearProgress /> : null}

      <DesktopSectionPanel sx={{ flex: 1 }}>
        <DesktopAppDataGrid<TeacherDueRow>
          rows={rows}
          columns={columns}
          getRowId={row => row.id}
          emptyMessage={labels.noPendingDues}
          loading={loading}
          autoHeight
          rowHeight={64}
          checkboxSelection
          onRowSelectionModelChange={model => {
            const selectedIds = "ids" in model ? Array.from(model.ids).map(String) : [];
            onSelectDues(selectedIds);
          }}
        />
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
