"use client";

import { MailOutlined } from "@mui/icons-material";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { profileHrefForStaff } from "@/frontend/common/utils/profileHref";
import { ManagerRowActions } from "@/frontend/common/views/dashboard/staff/home/ManagerRowActions";
import type { BaseManagersListProps, Manager, ManagerRole } from "@/frontend/common/views/dashboard/staff/home/types";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { DesktopPersonProfileLinkCell, DesktopPhoneDisplay } from "@/frontend/desktop/components/ui/display";

const StyledRoleChip = styled(Chip, {
  shouldForwardProp: prop => prop !== "role",
})<{ role: ManagerRole }>(({ theme, role }) => ({
  fontWeight: 700,
  textTransform: "uppercase",
  backgroundColor:
    role === "admin"
      ? theme.palette.primaryContainer
      : role === "supervisor"
        ? theme.palette.tertiaryContainer
        : theme.palette.secondaryContainer,
  color:
    role === "admin"
      ? theme.palette.onPrimaryContainer
      : role === "supervisor"
        ? theme.palette.onTertiaryContainer
        : theme.palette.onSecondaryContainer,
}));

const StyledDataGridWrapper = styled(Box)({
  width: "100%",
});

// VARIANT JUSTIFICATION: extra field loading — desktop data grid needs a `loading` prop because AppDataGrid accepts a loading slot while the mobile card list doesn't render a separate loading state (Class C variant per specs §4.3).
interface ManagersDataGridDesktopProps extends BaseManagersListProps {
  readonly loading?: boolean;
}

export function ManagersDataGridDesktop({
  labels,
  managers,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
  loading = false,
}: Readonly<ManagersDataGridDesktopProps>) {
  const t = labels;

  // RENDER OPT JUSTIFICATION: AppDataGrid re-renders excessively when its `columns` prop identity changes between renders; this useMemo preserves a stable column-array reference keyed on the translated labels so cells don't recompute unnecessarily.
  const columns = useMemo<GridColDef<Manager>[]>(
    () => [
      {
        field: "manager",
        headerName: t.table.manager,
        flex: 1.5,
        minWidth: 250,
        renderCell: params => (
          <Stack direction="row" spacing={2} sx={{ alignItems: "center", height: "100%" }}>
            <DesktopPersonProfileLinkCell
              href={profileHrefForStaff({ userId: params.row.userId })}
              name={params.row.name}
              avatarUrl={params.row.avatarUrl}
              avatarSize={40}
              typographyVariant="bodyMd"
              fontWeight={700}
            />
          </Stack>
        ),
      },
      {
        field: "status",
        headerName: t.table.status,
        width: 140,
        renderCell: params => (
          <Stack direction="row" sx={{ alignItems: "center", height: "100%" }}>
            <DesktopStatusBadge
              category="session"
              status={params.row.status === "active" ? "active" : "blocked"}
              label={t.status[params.row.status]}
            />
          </Stack>
        ),
      },
      {
        field: "email",
        headerName: t.table.contactDetails,
        flex: 1.5,
        minWidth: 200,
        renderCell: params => (
          <Stack
            direction="row"
            spacing={1}
            sx={theme => ({ alignItems: "center", height: "100%", color: theme.palette.text.secondary })}
          >
            <MailOutlined fontSize="small" sx={theme => ({ color: theme.palette.primaryContainer })} />
            <Typography variant="bodyMd">{params.row.email}</Typography>
          </Stack>
        ),
      },
      {
        field: "phone",
        headerName: t.table.phone,
        flex: 1,
        minWidth: 150,
        renderCell: params => <DesktopPhoneDisplay phone={params.row.phone} typographyVariant="bodyMd" />,
      },
      {
        field: "role",
        headerName: t.table.roleType,
        width: 120,
        renderCell: params => <StyledRoleChip label={t.roles[params.row.role]} size="small" role={params.row.role} />,
      },
      {
        field: "options",
        headerName: t.table.options,
        width: 140,
        align: "center",
        headerAlign: "center",
        renderCell: params => <ManagerRowActions labels={labels} manager={params.row} />,
      },
    ],
    [labels, t]
  );

  const isServerPagination = totalCount !== undefined && onPageChange !== undefined;

  return (
    <StyledDataGridWrapper>
      <DesktopAppDataGrid<Manager>
        rows={managers}
        columns={columns}
        getRowId={row => row.userId}
        emptyMessage={t.noEntries}
        loading={loading}
        autoHeight
        rowHeight={80}
        paginationOptions={
          isServerPagination
            ? buildServerPaginationOptions({
                page,
                pageSize,
                totalCount,
                onPageChange,
                pageSizeOptions: [pageSize],
              })
            : { mode: "client" }
        }
      />
    </StyledDataGridWrapper>
  );
}
