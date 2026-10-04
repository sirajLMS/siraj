import type { GridColDef } from "@mui/x-data-grid";
import type { ParentScheduleRow } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardTypes";
import type { ParentScheduleDataGridDesktopProps } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentScheduleComponents.types";
import {
  ParentScheduleBookingStatusCell,
  ParentScheduleClassTimeCell,
  ParentScheduleContactCell,
  ParentScheduleHistoryCell,
  ParentScheduleLiveClassStatusCell,
  ParentScheduleRowNumberCell,
  ParentScheduleStudentNameCell,
  ParentScheduleTeacherNameCell,
} from "@/frontend/desktop/views/dashboard/parent/dashboard/components/parentScheduleDataGrid.parts";

type ParentScheduleLabels = ParentScheduleDataGridDesktopProps["labels"];

export function buildParentScheduleColumns(
  labels: ParentScheduleLabels,
  onHistory: (id: string) => void
): GridColDef<ParentScheduleRow>[] {
  return [
    {
      field: "rowNumber",
      headerName: labels.schedule.rowNumber,
      width: 70,
      renderCell: ({ row }) => <ParentScheduleRowNumberCell row={row} labels={labels} />,
    },
    {
      field: "classTime",
      headerName: labels.schedule.classTime,
      flex: 1,
      minWidth: 140,
      renderCell: ({ row }) => <ParentScheduleClassTimeCell row={row} labels={labels} />,
    },
    {
      field: "studentName",
      headerName: labels.schedule.studentName,
      flex: 1.2,
      minWidth: 180,
      renderCell: ({ row }) => <ParentScheduleStudentNameCell row={row} labels={labels} />,
    },
    {
      field: "teacherName",
      headerName: labels.schedule.teacherName,
      flex: 1.2,
      minWidth: 180,
      renderCell: ({ row }) => <ParentScheduleTeacherNameCell row={row} labels={labels} />,
    },
    {
      field: "history",
      headerName: labels.schedule.history,
      width: 90,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: ({ row }) => <ParentScheduleHistoryCell row={row} labels={labels} onHistory={onHistory} />,
    },
    {
      field: "bookingStatus",
      headerName: labels.schedule.status,
      width: 140,
      renderCell: ({ row }) => <ParentScheduleBookingStatusCell row={row} labels={labels} />,
    },
    {
      field: "contact",
      headerName: labels.schedule.contact,
      width: 140,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: ({ row }) => <ParentScheduleContactCell row={row} labels={labels} />,
    },
    {
      field: "liveClassStatus",
      headerName: labels.schedule.classStatus,
      flex: 1,
      minWidth: 160,
      renderCell: ({ row }) => <ParentScheduleLiveClassStatusCell row={row} labels={labels} />,
    },
  ];
}
