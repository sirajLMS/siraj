"use client";

import { MailOutlined } from "@mui/icons-material";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { AppDataGrid, GridPagination, PersonProfileLinkCell } from "@/frontend/components/ui";
import { StatusBadge } from "@/frontend/components/ui/badge/StatusBadge";
import { profileHrefForStaff } from "@/frontend/utils/profileHref";
import { ManagerRowActions } from "./ManagerRowActions";
import type { Manager } from "./types";

const StyledRoleChip = styled(Chip, {
  shouldForwardProp: prop => prop !== "isStaff",
})<{ isStaff: boolean }>(({ theme, isStaff }) => ({
  fontWeight: 700,
  textTransform: "uppercase",
  backgroundColor: isStaff ? theme.palette.secondaryContainer : theme.palette.primaryContainer,
  color: isStaff ? theme.palette.onSecondaryContainer : theme.palette.onPrimaryContainer,
}));

const StyledDataGridWrapper = styled(Box)({
  width: "100%",
});

interface ManagersDataGridProps {
  managers: Manager[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  readonly loading?: boolean;
}

export function ManagersDataGrid({
  managers,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
  loading = false,
}: Readonly<ManagersDataGridProps>) {
  const t = useTranslations("dashboard.managersDirectory");

  const columns = useMemo<GridColDef<Manager>[]>(
    () => [
      {
        field: "userId",
        headerName: t("table.hash"),
        width: 80,
        valueGetter: (_, row) => row.userId.slice(0, 8),
      },
      {
        field: "manager",
        headerName: t("table.manager"),
        flex: 1.5,
        minWidth: 250,
        renderCell: params => (
          <Stack direction="row" spacing={2} sx={{ alignItems: "center", height: "100%" }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 0.5,
              }}
            >
              <PersonProfileLinkCell
                href={profileHrefForStaff({ userId: params.row.userId })}
                name={params.row.name}
                avatarUrl={params.row.avatarUrl}
                avatarSize={40}
                typographyVariant="bodyMd"
                fontWeight={700}
              />
              <StatusBadge
                category="session"
                status={params.row.status === "active" ? "active" : "blocked"}
                label={t(`status.${params.row.status}`)}
              />
            </Box>
          </Stack>
        ),
      },
      {
        field: "email",
        headerName: t("table.contactDetails"),
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
        headerName: t("table.phone"),
        flex: 1,
        minWidth: 150,
      },
      {
        field: "role",
        headerName: t("table.roleType"),
        width: 120,
        renderCell: params => {
          const isStaff = params.row.role === "staff";
          return <StyledRoleChip label={t(`roles.${params.row.role}`)} size="small" isStaff={isStaff} />;
        },
      },
      {
        field: "options",
        headerName: t("table.options"),
        width: 100,
        align: "center",
        headerAlign: "center",
        renderCell: params => <ManagerRowActions manager={params.row} />,
      },
    ],
    [t]
  );

  const isServerPagination = totalCount !== undefined && onPageChange !== undefined;

  return (
    <StyledDataGridWrapper>
      <AppDataGrid<Manager>
        rows={managers}
        columns={columns}
        getRowId={row => row.userId}
        emptyMessage={t("noEntries")}
        loading={loading}
        autoHeight
        rowHeight={80}
        {...(isServerPagination
          ? {
              paginationMode: "server" as const,
              rowCount: totalCount,
              paginationModel: { page, pageSize },
              onPaginationModelChange: model => {
                onPageChange(model.page);
              },
              pageSizeOptions: [pageSize],
              slots: { pagination: GridPagination },
            }
          : {})}
      />
    </StyledDataGridWrapper>
  );
}
