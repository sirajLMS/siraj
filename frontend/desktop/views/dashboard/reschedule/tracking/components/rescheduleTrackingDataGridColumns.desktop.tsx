"use client";

import type { GridColDef } from "@mui/x-data-grid";
import type {
  RescheduleTrackingDataGridLabels,
  TrackingRow,
} from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.types";
import { TrackingRowActionsCell } from "@/frontend/desktop/views/dashboard/reschedule/tracking/components/rescheduleTrackingDataGridActions.desktop.parts";
import {
  TrackingScheduledDateCell,
  TrackingStatusCell,
  TrackingStudentNameCell,
  TrackingTeacherNameCell,
  TrackingTimeSlotCell,
} from "@/frontend/desktop/views/dashboard/reschedule/tracking/components/rescheduleTrackingDataGridCells.desktop.parts";

interface BuildRescheduleTrackingDataGridColumnsParams {
  readonly headers: {
    readonly teacherName: string;
    readonly studentName: string;
    readonly scheduledDate: string;
    readonly timeSlot: string;
    readonly classStatus: string;
    readonly action: string;
  };
  readonly labels: RescheduleTrackingDataGridLabels;
  readonly onApprove: (id: string) => void;
  readonly onReject: (id: string) => void;
  readonly onView: (id: string) => void;
}

export function buildRescheduleTrackingDataGridColumns({
  headers,
  labels,
  onApprove,
  onReject,
  onView,
}: Readonly<BuildRescheduleTrackingDataGridColumnsParams>): GridColDef<TrackingRow>[] {
  return [
    {
      field: "teacherName",
      headerName: headers.teacherName,
      flex: 1.2,
      minWidth: 200,
      renderCell: ({ row }) => <TrackingTeacherNameCell row={row} />,
    },
    {
      field: "studentName",
      headerName: headers.studentName,
      flex: 1,
      minWidth: 160,
      renderCell: ({ row }) => <TrackingStudentNameCell row={row} />,
    },
    {
      field: "scheduledDate",
      headerName: headers.scheduledDate,
      flex: 1,
      minWidth: 160,
      renderCell: ({ row }) => (
        <TrackingScheduledDateCell row={row} leaveRequestLabel={labels.leaveRequest} newDateLabel={labels.newDate} />
      ),
    },
    {
      field: "timeSlot",
      headerName: headers.timeSlot,
      width: 140,
      flex: 1,
      renderCell: ({ row }) => <TrackingTimeSlotCell row={row} />,
    },
    {
      field: "status",
      headerName: headers.classStatus,
      width: 160,
      flex: 1,
      renderCell: ({ row }) => <TrackingStatusCell row={row} labels={{ ...labels, filterAll: "" }} />,
    },
    {
      field: "actions",
      headerName: headers.action,
      width: 100,
      sortable: false,
      align: "right",
      headerAlign: "center",
      renderCell: ({ row }) => (
        <TrackingRowActionsCell row={row} labels={labels} onApprove={onApprove} onReject={onReject} onView={onView} />
      ),
    },
  ];
}
