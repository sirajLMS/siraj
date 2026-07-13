"use client";

import { LinearProgress } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import {
  AppDataGrid,
  PageContainer,
  PageHeader,
  PrimaryPageAction,
  SectionPanel,
} from "@/frontend/common/components/ui";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import type { TeacherDueRow } from "@/frontend/common/views/dashboard/supervisor/teacher-dues/types/teacherDuesTypes";
import type { TeacherDuesViewModel } from "@/frontend/common/views/dashboard/supervisor/teacher-dues/useTeacherDuesViewModel";

interface TeacherDuesDesktopViewProps extends TeacherDuesViewModel {
  readonly rows: readonly TeacherDueRow[];
}

export function TeacherDuesDesktopView({
  rows,
  loading,
  markingPaid,
  selectedDueIds,
  labels,
  onSelectDues,
  onMarkPaid,
}: Readonly<TeacherDuesDesktopViewProps>) {
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
          <StatusBadge
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
          <PrimaryPageAction size="small" onClick={() => onMarkPaid([params.row.id])} disabled={markingPaid}>
            {labels.markAsPaidButton}
          </PrimaryPageAction>
        ),
      },
    ],
    [labels, markingPaid, onMarkPaid]
  );

  return (
    <PageContainer>
      <PageHeader
        title={labels.pageTitle}
        actions={
          selectedDueIds.length > 0 ? (
            <PrimaryPageAction onClick={() => onMarkPaid(selectedDueIds)} disabled={markingPaid}>
              {labels.markAsPaidButton}
            </PrimaryPageAction>
          ) : null
        }
      />

      {loading ? <LinearProgress /> : null}

      <SectionPanel sx={{ flex: 1 }}>
        <AppDataGrid<TeacherDueRow>
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
      </SectionPanel>
    </PageContainer>
  );
}
