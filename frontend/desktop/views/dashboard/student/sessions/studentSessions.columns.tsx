"use client";

import type { GridColDef } from "@mui/x-data-grid";
import { DateTimeTooltipDisplay } from "@/frontend/common/components/intl/DateTimeTooltipDisplay";
import type { StudentHistorySessionRow } from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";
import type { StudentSessionsViewModel } from "@/frontend/common/views/dashboard/student/sessions/useStudentSessionsViewModel";
import {
  SessionActionsCell,
  SessionDurationCell,
  SessionInstructorCell,
  SessionNotesCell,
  SessionStatusCell,
  SessionTitleCell,
} from "@/frontend/desktop/views/dashboard/student/sessions/studentSessions.parts";

export function buildStudentSessionsColumns(
  labels: StudentSessionsViewModel["labels"],
  locale: string,
  onOpenMeetingUrl: StudentSessionsViewModel["onOpenMeetingUrl"]
): GridColDef<StudentHistorySessionRow>[] {
  return [
    {
      field: "title",
      headerName: labels.subject,
      flex: 1.2,
      minWidth: 160,
      renderCell: ({ row }) => <SessionTitleCell row={row} />,
    },
    {
      field: "time",
      headerName: labels.sessionDate,
      flex: 1,
      minWidth: 140,
      valueGetter: (_, row) => row.time,
      renderCell: ({ row }) => <DateTimeTooltipDisplay value={row.time} locale={locale} />,
    },
    {
      field: "instructor",
      headerName: labels.instructor,
      flex: 1.1,
      minWidth: 160,
      renderCell: ({ row }) => <SessionInstructorCell row={row} />,
    },
    {
      field: "duration",
      headerName: labels.duration,
      flex: 0.7,
      minWidth: 90,
      renderCell: ({ row }) => <SessionDurationCell row={row} labels={labels} />,
    },
    {
      field: "status",
      headerName: labels.status,
      flex: 0.9,
      minWidth: 120,
      sortable: false,
      renderCell: ({ row }) => <SessionStatusCell row={row} labels={labels} />,
    },
    {
      field: "notes",
      headerName: labels.notes,
      flex: 1.2,
      minWidth: 140,
      renderCell: ({ row }) => <SessionNotesCell row={row} />,
    },
    {
      field: "actions",
      headerName: "",
      width: 72,
      sortable: false,
      renderCell: ({ row }) => <SessionActionsCell row={row} labels={labels} onOpenMeetingUrl={onOpenMeetingUrl} />,
    },
  ];
}
