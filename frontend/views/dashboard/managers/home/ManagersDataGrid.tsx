"use client";

import { MailOutlined } from "@mui/icons-material";
import { Avatar, Box, Chip, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { AppDataGrid, GridPagination } from "@/frontend/components/ui";
import { StatusBadge } from "@/frontend/components/ui/StatusBadge";
import { ManagerRowActions } from "./ManagerRowActions";
import type { Manager } from "./types";

const StyledManagerAvatar = styled(Avatar)({
  width: 40,
  height: 40,
});

const StyledManagerNameTypography = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.main,
}));

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
}

export function ManagersDataGrid({
  managers,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
}: Readonly<ManagersDataGridProps>) {
  const t = useTranslations("dashboard.managersDirectory");

  const columns = useMemo<GridColDef<Manager>[]>(
    () => [
      {
        field: "id",
        headerName: t("table.hash"),
        width: 80,
        valueGetter: (_, row) => row.id.replace("MGR-", ""),
      },
      {
        field: "manager",
        headerName: t("table.manager"),
        flex: 1.5,
        minWidth: 250,
        renderCell: params => (
          <Stack direction="row" spacing={2} sx={{ alignItems: "center", height: "100%" }}>
            <StyledManagerAvatar src={params.row.avatarUrl || undefined} alt={params.row.name}>
              {params.row.avatarUrl ? undefined : params.row.name.charAt(0).toUpperCase()}
            </StyledManagerAvatar>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <StyledManagerNameTypography variant="bodyMd">{params.row.name}</StyledManagerNameTypography>
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
        field: "skypeId",
        headerName: t("table.skypeId"),
        flex: 1,
        minWidth: 150,
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
        emptyMessage={t("noEntries")}
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
