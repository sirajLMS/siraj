"use client";

import { Box } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import {
  type TeacherClassListCellProps,
  TeacherClassName,
  type TeacherClassRow,
  TeacherClassRowActions,
  TeacherClassSchedule,
  TeacherClassStatusSummary,
} from "@/frontend/common/views/dashboard/teachers/classes/__shared__/teacherClassListViewShared";

/** DataGrid column contract for the desktop teacher class list. */
export function buildTeacherClassListColumns(
  args: Readonly<Omit<TeacherClassListCellProps, "row">>
): GridColDef<TeacherClassRow>[] {
  const { labels, locale, onViewClassAudit, slots } = args;
  return [
    {
      field: "studentName",
      headerName: labels.columns.student,
      flex: 1,
      minWidth: 160,
      renderCell: ({ row }) => <TeacherClassName name={row.studentName} />,
    },
    {
      field: "scheduledStartAt",
      headerName: labels.columns.schedule,
      flex: 1,
      minWidth: 200,
      sortable: false,
      renderCell: ({ row }) => <TeacherClassSchedule row={row} locale={locale} />,
    },
    {
      field: "status",
      headerName: labels.columns.status,
      flex: 1,
      minWidth: 160,
      sortable: false,
      renderCell: ({ row }) => <TeacherClassStatusSummary row={row} labels={labels} />,
    },
    {
      field: "actions",
      headerName: labels.columns.actions,
      flex: 1,
      minWidth: 240,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, height: "100%", flexWrap: "wrap" }}>
          <TeacherClassRowActions row={row} labels={labels} onViewClassAudit={onViewClassAudit} slots={slots} />
        </Box>
      ),
    },
  ];
}
