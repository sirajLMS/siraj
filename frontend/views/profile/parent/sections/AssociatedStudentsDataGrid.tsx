"use client";

import { Avatar, Stack, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { AppDataGrid, StatusBadge } from "@/frontend/components/ui";
import { Link } from "@/shared/i18n/routing";
import type { AssociatedStudentRow } from "./parentProfileTypes";

type AssociatedStudentsDataGridProps = {
  readonly rows: readonly AssociatedStudentRow[];
  readonly loading?: boolean;
  readonly emptyMessage: string;
};

function formatStatusLabel(status: string): string {
  const normalized = status.replaceAll("_", " ").toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getInitial(name: string | null | undefined, fallback: string): string {
  return (name?.trim()?.[0] ?? fallback).toUpperCase();
}

function ProfileLinkCell({
  href,
  avatarUrl,
  name,
  fallbackInitial,
}: {
  readonly href: string;
  readonly avatarUrl?: string | null;
  readonly name: string;
  readonly fallbackInitial: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit", display: "flex", height: "100%" }}>
      <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", height: "100%" }}>
        <Avatar src={avatarUrl ?? undefined} sx={{ width: 28, height: 28 }}>
          {getInitial(name, fallbackInitial)}
        </Avatar>
        <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.primary.main, fontWeight: 600 }}>
          {name}
        </Typography>
      </Stack>
    </Link>
  );
}

export function AssociatedStudentsDataGrid({ rows, loading = false, emptyMessage }: AssociatedStudentsDataGridProps) {
  const t = useTranslations("profile.parent");
  const tc = useTranslations("profile");

  const columns = useMemo<GridColDef<AssociatedStudentRow>[]>(
    () => [
      {
        field: "name",
        headerName: t("students.columns.name"),
        flex: 1.5,
        minWidth: 220,
        renderCell: params => (
          <ProfileLinkCell
            href={`/students/${params.row.id}`}
            avatarUrl={params.row.studentAvatarUrl}
            name={params.row.name ?? tc("notSet")}
            fallbackInitial="S"
          />
        ),
      },
      {
        field: "status",
        headerName: t("students.columns.status"),
        flex: 1,
        minWidth: 130,
        renderCell: params => (
          <StatusBadge
            category="studentAccount"
            status={(params.row.status ?? "REGULAR").toLowerCase()}
            label={formatStatusLabel(params.row.status ?? "REGULAR")}
          />
        ),
      },
      {
        field: "teacherName",
        headerName: t("students.columns.teacher"),
        flex: 1.5,
        minWidth: 220,
        renderCell: params => {
          const teacherName = params.row.teacherName?.trim() || tc("notSet");
          if (!params.row.teacherUserId) {
            return (
              <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
                {teacherName}
              </Typography>
            );
          }

          return (
            <ProfileLinkCell
              href={`/users/${params.row.teacherUserId}/profile`}
              avatarUrl={params.row.teacherAvatarUrl}
              name={teacherName}
              fallbackInitial="T"
            />
          );
        },
      },
      {
        field: "hoursPerWeek",
        headerName: t("students.columns.hoursPerWeek"),
        flex: 1,
        minWidth: 140,
        renderCell: params => (
          <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
            {params.row.hoursPerWeek}
          </Typography>
        ),
      },
    ],
    [t, tc]
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
