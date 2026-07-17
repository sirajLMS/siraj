"use client";

import { DeleteOutlined, PersonAddOutlined, PersonRemoveOutlined, SearchOutlined } from "@mui/icons-material";
import { Avatar, Box, Button, Checkbox, InputAdornment, TextField, Typography } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { ViewAsUserButton } from "@/frontend/common/components/auth/ViewAsUserButton";
import type { GroupUser, PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { profileHrefForUser } from "@/frontend/common/utils/profileHref";
import { DesktopAppDataGrid, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { Link } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale";

const StyledTabContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
}));

const StyledUserToolbar = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: Number(theme.shape.borderRadius) * 2,
  backgroundColor: theme.palette.surfaceContainerLow ?? theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  display: "flex",
  flexDirection: "row",
  gap: theme.spacing(2),
  alignItems: "center",
  justifyContent: "space-between",
}));

const StyledAssignUsersButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.onPrimary,
  textTransform: "none",
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
  fontWeight: 600,
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
}));

const StyledBulkActionBar = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
  backgroundColor: theme.palette.errorContainer ?? alpha(theme.palette.error.main, 0.15),
  color: theme.palette.onErrorContainer ?? theme.palette.error.main,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  boxShadow: theme.palette.shadow.card,
}));

const StyledRemoveSelectedButton = styled(Button)(({ theme }) => ({
  textTransform: "none",
  fontWeight: 700,
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
}));

const StyledUserAvatar = styled(Avatar)(({ theme }) => ({
  width: 32,
  height: 32,
  backgroundColor: theme.palette.primaryContainer,
  color: theme.palette.onPrimaryContainer,
  typography: "bodyMd",
  fontWeight: 600,
}));

const StyledUserInfoContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
});

const StyledUserNameText = styled(Typography)({
  fontWeight: 600,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

const StyledUserEmailText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  typography: "labelMd",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}));

const StyledRemoveButton = styled(Button)(() => ({
  fontWeight: 600,
  typography: "labelMd",
}));

interface AssignedUsersTabDesktopProps {
  readonly group: PermissionGroup;
  readonly filteredAssignedUsers: readonly GroupUser[];
  readonly selectedAssignedUserIds: readonly string[];
  readonly searchQuery: string;
  readonly onBulkRevokeUsers: () => void;
  readonly onRevokeUser: (userId: string) => void;
  readonly onUserToggle: (id: string, checked: boolean) => void;
  readonly onSearchChange: (value: string) => void;
  readonly onAssignGroup: (id: string) => void;
  readonly loading?: boolean;
}

export function AssignedUsersTabDesktop({
  group,
  filteredAssignedUsers,
  selectedAssignedUserIds,
  searchQuery,
  onBulkRevokeUsers,
  onRevokeUser,
  onUserToggle,
  onSearchChange,
  onAssignGroup,
  loading = false,
}: Readonly<AssignedUsersTabDesktopProps>) {
  const t = useAppTranslation().dashboardTranslations.permissions;

  const assignedUsersColumns = useMemo<GridColDef<GroupUser>[]>(() => {
    return [
      {
        field: "checkbox",
        headerName: "",
        width: 50,
        sortable: false,
        renderCell: (params: { row: GroupUser }) => {
          const id = params.row.id ?? "";
          const checked = selectedAssignedUserIds.includes(id);
          return <Checkbox size="small" checked={checked} onChange={e => onUserToggle(id, e.target.checked)} />;
        },
      },
      {
        field: "name",
        headerName: t.columnName,
        flex: 1.5,
        minWidth: 200,
        renderCell: (params: { row: GroupUser }) => {
          const user = params.row;
          const profileHref = user.id ? profileHrefForUser(user.id) : undefined;
          const nameText = <StyledUserNameText variant="bodyMd">{user.name}</StyledUserNameText>;

          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
              <StyledUserAvatar>
                {user.name
                  ?.split(" ")
                  .map((w: string) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </StyledUserAvatar>
              <StyledUserInfoContainer>
                {profileHref ? (
                  <Link href={profileHref} style={{ textDecoration: "none", color: "inherit" }}>
                    {nameText}
                  </Link>
                ) : (
                  nameText
                )}
                <StyledUserEmailText variant="bodyMd">{user.email}</StyledUserEmailText>
              </StyledUserInfoContainer>
            </Box>
          );
        },
      },
      {
        field: "assignedDate",
        headerName: t.assignedDate,
        flex: 1.2,
        minWidth: 150,
        renderCell: () => {
          const date = group.createdAt ? new Date(group.createdAt) : new Date();
          return (
            <Typography variant="bodyMd">
              {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </Typography>
          );
        },
      },
      {
        field: "assignedBy",
        headerName: t.assignedBy,
        flex: 1,
        minWidth: 120,
        renderCell: () => (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {t.assignedBySystem}
          </Typography>
        ),
      },
      {
        field: "actions",
        headerName: "",
        width: 160,
        align: "right",
        sortable: false,
        renderCell: params => (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
            {params.row.id ? (
              <ViewAsUserButton
                variant="link"
                targetUserId={params.row.id}
                targetUserName={params.row.name ?? params.row.email ?? ""}
                targetIsSuperAdmin={group.slug === "super_admin"}
              />
            ) : null}
            <StyledRemoveButton
              size="small"
              color="error"
              startIcon={<PersonRemoveOutlined fontSize="small" />}
              onClick={() => params.row.id && onRevokeUser(params.row.id)}
            >
              {t.removeUser}
            </StyledRemoveButton>
          </Box>
        ),
      },
    ];
  }, [t, group.createdAt, group.slug, selectedAssignedUserIds, onRevokeUser, onUserToggle]);

  return (
    <StyledTabContainer>
      <StyledUserToolbar>
        <TextField
          size="small"
          placeholder={t.searchAssignedUsers}
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ width: 360 }}
        />
        <StyledAssignUsersButton
          variant="contained"
          startIcon={<PersonAddOutlined />}
          onClick={() => group.id && onAssignGroup(group.id)}
        >
          {t.assignUsers}
        </StyledAssignUsersButton>
      </StyledUserToolbar>

      {selectedAssignedUserIds.length > 0 && (
        <StyledBulkActionBar>
          <Typography variant="titleLg" sx={{ fontWeight: 600 }}>
            {t.usersSelected(selectedAssignedUserIds.length)}
          </Typography>
          <StyledRemoveSelectedButton
            variant="contained"
            color="error"
            startIcon={<DeleteOutlined />}
            onClick={onBulkRevokeUsers}
          >
            {t.removeSelected}
          </StyledRemoveSelectedButton>
        </StyledBulkActionBar>
      )}

      <DesktopSectionPanel title={t.assignedGroupMembers}>
        <DesktopAppDataGrid<GroupUser>
          rows={filteredAssignedUsers}
          columns={assignedUsersColumns}
          getRowId={row => row.id ?? row.email ?? ""}
          emptyMessage={t.noAssignedUsers}
          loading={loading}
          autoHeight
        />
      </DesktopSectionPanel>
    </StyledTabContainer>
  );
}
