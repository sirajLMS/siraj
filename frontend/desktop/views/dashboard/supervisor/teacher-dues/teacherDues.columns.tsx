import type { GridColDef } from "@mui/x-data-grid";
import type {
  TeacherDueRow,
  TeacherDuesColumnParams,
} from "@/frontend/common/views/dashboard/supervisor/teacher-dues/types/teacherDuesTypes";
import {
  MarkAsPaidCell,
  RateSourceCell,
  StatusCell,
  StudentNameCell,
  TeacherNameCell,
} from "@/frontend/desktop/views/dashboard/supervisor/teacher-dues/teacherDues.parts";

function formatDueDate(value: string | null, fallback: string): string {
  if (!value) return "-";
  // Render ISO timestamps as readable dates (e.g. "Feb 2, 2026") instead of raw strings.
  try {
    return new Date(value).toLocaleDateString("en", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return fallback;
  }
}

export function buildTeacherDuesColumns({
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
      valueGetter: (_, row) => formatDueDate(row.classDate, row.classDate),
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
      width: 130,
      valueGetter: (_, row) => row.currency ?? "",
    },
    {
      field: "status",
      headerName: labels.statusColumn,
      width: 130,
      renderCell: params => <StatusCell row={params.row} labels={labels} />,
    },
    {
      field: "rateSource",
      headerName: labels.rateSourceColumn,
      width: 130,
      renderCell: params => <RateSourceCell row={params.row} labels={labels} />,
    },
    {
      field: "approvedAt",
      headerName: labels.approvedDateColumn,
      flex: 1,
      minWidth: 150,
      valueGetter: (_, row) => formatDueDate(row.approvedAt, row.approvedAt),
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
