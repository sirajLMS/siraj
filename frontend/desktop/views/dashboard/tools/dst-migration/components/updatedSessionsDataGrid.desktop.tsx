"use client";

import { ArrowForwardOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import type { UpdatedSession } from "@/frontend/common/views/dashboard/tools/dst-migration/dst-migration.types";
import { DesktopAppDataGrid, DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui";
import type { DstMigrationLabels } from "@/shared/locale/types/dashboard/admin/dstMigration";

interface Props {
  readonly labels: DstMigrationLabels;
  readonly sessions: readonly UpdatedSession[];
  readonly loading?: boolean;
}

export function UpdatedSessionsDataGridDesktop({ labels, sessions, loading = false }: Readonly<Props>) {
  const columns = useMemo<GridColDef<UpdatedSession>[]>(
    () => [
      {
        field: "studentName",
        headerName: labels.table.studentName,
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
        headerName: labels.table.from,
        width: 130,
        align: "center",
        headerAlign: "center",
        renderCell: params => <Typography variant="bodyMd">{params.row.fromTime}</Typography>,
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
        headerName: labels.table.to,
        width: 130,
        align: "center",
        headerAlign: "center",
        renderCell: params => <Typography variant="bodyMd">{params.row.toTime}</Typography>,
      },
    ],
    [labels]
  );

  return (
    <DesktopAppDataGrid
      rows={sessions}
      columns={columns}
      getRowId={row => row.id}
      paginationOptions={false}
      ariaLabel="dst-updated-sessions-table"
      emptyMessage={labels.sections.updated}
      loading={loading}
      sx={{ border: "none" }}
    />
  );
}
