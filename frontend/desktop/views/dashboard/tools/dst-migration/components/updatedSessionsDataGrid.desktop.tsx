"use client";

import { ArrowForwardOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import type { UpdatedSession } from "@/frontend/common/views/dashboard/tools/dst-migration/dst-migration.types";
import { DesktopAppDataGrid, DesktopPersonProfileLinkCell, DesktopStatusBadge } from "@/frontend/desktop/components/ui";
import { useAppTranslation } from "@/shared/locale";

interface Props {
  readonly sessions: readonly UpdatedSession[];
  readonly loading?: boolean;
}

export function UpdatedSessionsDataGridDesktop({ sessions, loading = false }: Readonly<Props>) {
  const t = useAppTranslation().dashboardTranslations.dstMigration;

  const columns = useMemo<GridColDef<UpdatedSession>[]>(
    () => [
      {
        field: "studentName",
        headerName: t.table.studentName,
        flex: 1.5,
        minWidth: 220,
        renderCell: params => (
          <Box sx={{ py: 1 }}>
            <DesktopPersonProfileLinkCell
              href={params.row.studentId ? studentHref(params.row.studentId) : undefined}
              name={params.row.studentName}
              showAvatar={false}
              typographyVariant="bodyMd"
              fontWeight={700}
            />
            <DesktopPersonProfileLinkCell
              href={profileHrefForTeacher({ teacherId: params.row.teacherId })}
              name={params.row.teacherName}
              showAvatar={false}
              typographyVariant="labelMd"
              fontWeight={400}
            />
          </Box>
        ),
      },
      {
        field: "fromTime",
        headerName: t.table.from,
        width: 130,
        align: "center",
        headerAlign: "center",
        renderCell: params => <DesktopStatusBadge category="session" status="pending" label={params.row.fromTime} />,
      },
      {
        field: "arrow",
        headerName: "",
        width: 60,
        sortable: false,
        filterable: false,
        align: "center",
        headerAlign: "center",
        renderCell: () => (
          <ArrowForwardOutlined sx={theme => ({ fontSize: 16, color: theme.palette.text.secondary })} />
        ),
      },
      {
        field: "toTime",
        headerName: t.table.to,
        width: 130,
        align: "center",
        headerAlign: "center",
        renderCell: params => <DesktopStatusBadge category="session" status="completed" label={params.row.toTime} />,
      },
    ],
    [t]
  );

  return (
    <DesktopAppDataGrid
      rows={sessions}
      columns={columns}
      getRowId={row => row.id}
      hideFooter
      ariaLabel="dst-updated-sessions-table"
      emptyMessage={t.sections.updated}
      loading={loading}
      sx={{ border: "none" }}
    />
  );
}
