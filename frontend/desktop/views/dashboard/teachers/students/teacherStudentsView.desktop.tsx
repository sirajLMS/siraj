"use client";

import { Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { studentHref } from "@/frontend/common/utils/profileHref";
import {
  TeacherStudentsViewShared,
  type TeacherStudentsViewSharedListProps,
} from "@/frontend/common/views/dashboard/teachers/students/__shared__/teacherStudentsViewShared";
import type { TeacherStudentsViewModel } from "@/frontend/common/views/dashboard/teachers/students/useTeacherStudentsViewModel";
import {
  DesktopAppDataGrid,
  DesktopPageContainer,
  DesktopPageHeader,
  DesktopSectionPanel,
} from "@/frontend/desktop/components/ui";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui/display";

type StudentRow = TeacherStudentsViewModel["rows"][number];
type StudentLabels = TeacherStudentsViewModel["labels"];

function buildStudentColumns(labels: StudentLabels): GridColDef<StudentRow>[] {
  return [
    {
      field: "name",
      headerName: labels.columns.name,
      flex: 1.5,
      minWidth: 240,
      renderCell: params => (
        <DesktopPersonProfileLinkCell
          href={params.row.id ? studentHref(params.row.id) : undefined}
          name={params.row.name ?? ""}
          fallbackInitial="S"
        />
      ),
    },
    {
      field: "status",
      headerName: labels.columns.status,
      flex: 1,
      minWidth: 160,
      renderCell: params => (
        <DesktopStatusBadge
          category="studentAccount"
          status={(params.row.status ?? "").toLowerCase()}
          label={labels.statusLabel(params.row.status ?? "")}
        />
      ),
    },
    {
      field: "quota",
      headerName: labels.columns.quota,
      flex: 1,
      minWidth: 170,
      sortable: false,
      renderCell: params => (
        <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
          {labels.quotaLabel(params.row.classesRemaining ?? 0, params.row.classesTotal ?? 0)}
        </Typography>
      ),
    },
    {
      field: "hoursPerWeek",
      headerName: labels.columns.hours,
      flex: 1,
      minWidth: 150,
      renderCell: params => (
        <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
          {labels.hoursLabel(params.row.hoursPerWeek ?? 0)}
        </Typography>
      ),
    },
  ];
}

function DesktopStudentsGrid({
  rows,
  labels,
  emptyMessage,
  paginationOptions,
}: Readonly<TeacherStudentsViewSharedListProps>) {
  return (
    <DesktopSectionPanel contentPadding={false}>
      <DesktopAppDataGrid
        rows={rows}
        columns={buildStudentColumns(labels)}
        getRowId={row => row.id ?? row.name ?? ""}
        emptyMessage={emptyMessage}
        ariaLabel={labels.pageTitle}
        paginationOptions={paginationOptions}
      />
    </DesktopSectionPanel>
  );
}

export function TeacherStudentsDesktopView(props: Readonly<TeacherStudentsViewModel>) {
  return (
    <TeacherStudentsViewShared
      {...props}
      slots={{
        PageContainer: DesktopPageContainer,
        PageHeader: DesktopPageHeader,
        ListWrapper: DesktopStudentsGrid,
      }}
    />
  );
}
