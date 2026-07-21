"use client";

import { LinearProgress } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import type {
  TeacherDueRow,
  TeacherDuesColumnLabels,
  TeacherDuesColumnParams,
  TeacherDuesViewModel,
} from "@/frontend/common/views/dashboard/supervisor/teacher-dues/types/teacherDuesTypes";
import { DesktopAppDataGrid, DesktopPrimaryPageAction, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui/display/personProfileLink/PersonProfileLinkCell.desktop";

function TeacherNameCell({ row }: Readonly<{ row: TeacherDueRow }>) {
  return (
    <DesktopPersonProfileLinkCell
      href={profileHrefForTeacher({ userId: row.teacherUserId, teacherId: row.teacherId })}
      name={row.teacherName || row.teacherId}
      avatarUrl={row.teacherAvatarUrl}
    />
  );
}

function StudentNameCell({ row }: Readonly<{ row: TeacherDueRow }>) {
  return (
    <DesktopPersonProfileLinkCell
      href={row.studentId ? studentHref(row.studentId) : undefined}
      name={row.studentName || row.studentId}
      avatarUrl={row.studentAvatarUrl}
    />
  );
}

function StatusCell({ row }: Readonly<{ row: TeacherDueRow }>) {
  const status = row.status ?? "PENDING";
  return <DesktopStatusBadge category="invoice" status={status} label={status} />;
}

function MarkAsPaidCell({
  row,
  canMarkPaid,
  markingPaid,
  labels,
  onMarkPaid,
}: Readonly<{
  row: TeacherDueRow;
  canMarkPaid: boolean;
  markingPaid: boolean;
  labels: TeacherDuesColumnLabels;
  onMarkPaid: (dueIds: string[]) => void;
}>) {
  if (!canMarkPaid) return null;
  return (
    <DesktopPrimaryPageAction size="small" onClick={() => onMarkPaid([row.id])} disabled={markingPaid}>
      {labels.markAsPaidButton}
    </DesktopPrimaryPageAction>
  );
}

function buildColumns({
  labels,
  canMarkPaid,
  markingPaid,
  onMarkPaid,
}: TeacherDuesColumnParams): GridColDef<TeacherDueRow>[] {
  return [
    {
      field: "teacherName",
      headerName: labels.teacherNameColumn,
      flex: 1,
      minWidth: 150,
      renderCell: params => <TeacherNameCell row={params.row} />,
    },
    {
      field: "classDate",
      headerName: labels.classDateColumn,
      flex: 1,
      minWidth: 150,
      valueGetter: (_, row) => row.classDate || "-",
    },
    {
      field: "studentName",
      headerName: labels.studentColumn,
      flex: 1,
      minWidth: 150,
      renderCell: params => <StudentNameCell row={params.row} />,
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
      valueGetter: (_, row) => `${row.currency ?? ""} ${row.amount}`.trim(),
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
      renderCell: params => <StatusCell row={params.row} />,
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
      sortable: false,
      renderCell: params => (
        <MarkAsPaidCell
          row={params.row}
          canMarkPaid={canMarkPaid}
          markingPaid={markingPaid}
          labels={labels}
          onMarkPaid={onMarkPaid}
        />
      ),
    },
  ];
}

export function TeacherDuesDesktopView({
  rows,
  loading,
  markingPaid,
  canMarkPaid,
  selectedDueIds,
  labels,
  onMarkPaid,
  onSelectDues,
}: Readonly<TeacherDuesViewModel>) {
  const columns = useMemo<GridColDef<TeacherDueRow>[]>(
    () => buildColumns({ labels, canMarkPaid, markingPaid, onMarkPaid }),
    [labels, markingPaid, onMarkPaid, canMarkPaid]
  );

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={labels.pageTitle}
        actions={
          canMarkPaid && selectedDueIds.length > 0 ? (
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
          checkboxSelection={canMarkPaid}
          paginationOptions={{ mode: "client" }}
          onRowSelectionModelChange={model => {
            const selectedIds = "ids" in model ? Array.from(model.ids).map(String) : [];
            onSelectDues(selectedIds);
          }}
        />
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
