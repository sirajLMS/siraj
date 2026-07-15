"use client";

import { Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGrid, PersonProfileLinkCell, StatusBadge } from "@/frontend/common/components/ui";
import { profileHrefForUser, studentHref } from "@/frontend/common/utils/profileHref";
import type { AssociatedStudentRow } from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { useAppTranslation } from "@/shared/locale/client";

type AssociatedStudentsDataGridProps = {
  readonly rows: readonly AssociatedStudentRow[];
  readonly loading?: boolean;
  readonly emptyMessage: string;
};

export function AssociatedStudentsDataGrid({ rows, loading = false, emptyMessage }: AssociatedStudentsDataGridProps) {
  const t = useAppTranslation("profile").parent;
  const tProfile = useAppTranslation("profile");

  const columns = useMemo<GridColDef<AssociatedStudentRow>[]>(
    () => [
      {
        field: "name",
        headerName: t.students.columns.name,
        flex: 1.5,
        minWidth: 220,
        renderCell: params => (
          <PersonProfileLinkCell
            href={params.row.id ? studentHref(params.row.id) : undefined}
            avatarUrl={params.row.studentAvatarUrl}
            name={params.row.name ?? tProfile.notSet}
            fallbackInitial={t.common.student.fallbackInitial}
          />
        ),
      },
      {
        field: "status",
        headerName: t.students.columns.status,
        flex: 1,
        minWidth: 130,
        renderCell: params => {
          const status = (params.row.status ?? "REGULAR").toLowerCase();
          const statusLabel = t.students.statusLabel[status as keyof typeof t.students.statusLabel];
          return <StatusBadge category="studentAccount" status={status} label={statusLabel} />;
        },
      },
      {
        field: "teacherName",
        headerName: t.students.columns.teacher,
        flex: 1.5,
        minWidth: 220,
        renderCell: params => {
          const teacherName = params.row.teacherName?.trim() || t.notSet;
          const href = params.row.teacherUserId ? profileHrefForUser(params.row.teacherUserId) : undefined;

          return (
            <PersonProfileLinkCell
              href={href}
              avatarUrl={params.row.teacherAvatarUrl}
              name={teacherName}
              fallbackInitial={t.common.teacher.fallbackInitial}
              emphasizeLink={Boolean(href)}
            />
          );
        },
      },
      {
        field: "hoursPerWeek",
        headerName: t.students.columns.hoursPerWeek,
        flex: 1,
        minWidth: 140,
        renderCell: params => (
          <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
            {params.row.hoursPerWeek}
          </Typography>
        ),
      },
    ],
    [t, tProfile.notSet]
  );

  return (
    <AppDataGrid
      rows={rows}
      columns={columns}
      loading={loading}
      getRowId={row => row.id ?? `associated-${row.name ?? "student"}`}
      hideFooter
      emptyMessage={emptyMessage}
      sx={{ border: "none" }}
    />
  );
}
