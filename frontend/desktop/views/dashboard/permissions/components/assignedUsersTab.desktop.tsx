"use client";

import { DeleteOutlined, PersonAddOutlined, PersonRemoveOutlined, SearchOutlined } from "@mui/icons-material";
import { Avatar, Box, Button, InputAdornment, TextField, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { ViewAsUserButton } from "@/frontend/common/components/auth/ViewAsUserButton";
import type { GroupUser } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { profileHrefForUser } from "@/frontend/common/utils/profileHref";
import { AssignedUsersTabShared } from "@/frontend/common/views/dashboard/permissions/components/assignedUsersTabShared";
import {
  StyledBulkActionBar,
  StyledRemoveButton,
  StyledRemoveSelectedButton,
  StyledUserToolbar,
} from "@/frontend/common/views/dashboard/permissions/components/assignedUsersTabShared.styles";
import type { AssignedUsersTabProps } from "@/frontend/common/views/dashboard/permissions/types/assignedUsersTab.types";
import type { AssignedUsersListSlotProps } from "@/frontend/common/views/dashboard/permissions/types/assignedUsersTabShared.types";
import { DesktopAppDataGrid, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { Link } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale";

const StyledDesktopToolbar = styled(StyledUserToolbar)({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
});

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

const StyledUserAvatar = styled(Avatar)(({ theme }) => ({
  width: 32,
  height: 32,
  backgroundColor: theme.palette.primaryContainer,
  color: theme.palette.onPrimaryContainer,
  typography: "bodyMd",
  fontWeight: 600,
}));

function AssignedUsersDesktopToolbar({
  searchQuery,
  onSearchChange,
  onAssignGroup,
  groupId,
  assignUsersLabel,
  searchPlaceholder,
}: Readonly<{
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onAssignGroup: (id: string) => void;
  groupId: string | null | undefined;
  assignUsersLabel: string;
  searchPlaceholder: string;
  loading: boolean;
}>) {
  return (
    <StyledDesktopToolbar>
      <TextField
        size="small"
        placeholder={searchPlaceholder}
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
        onClick={() => groupId && onAssignGroup(groupId)}
      >
        {assignUsersLabel}
      </StyledAssignUsersButton>
    </StyledDesktopToolbar>
  );
}

function DesktopBulkActionBar({
  selectedCount,
  onBulkRevokeUsers,
  usersSelectedLabel,
  removeSelectedLabel,
}: Readonly<{
  selectedCount: number;
  onBulkRevokeUsers: () => void;
  usersSelectedLabel: (count: number) => string;
  removeSelectedLabel: string;
}>) {
  return (
    <StyledBulkActionBar>
      <Typography variant="titleLg" sx={{ fontWeight: 600 }}>
        {usersSelectedLabel(selectedCount)}
      </Typography>
      <StyledRemoveSelectedButton
        variant="contained"
        color="error"
        startIcon={<DeleteOutlined />}
        onClick={onBulkRevokeUsers}
      >
        {removeSelectedLabel}
      </StyledRemoveSelectedButton>
    </StyledBulkActionBar>
  );
}

const userInitials = (name?: string | null): string =>
  (name ?? "")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function AssignedUsersDataGrid({ props, labels }: Readonly<AssignedUsersListSlotProps>) {
  const { group, filteredAssignedUsers, selectedAssignedUserIds, onRevokeUser, onUserToggle, loading } = props;

  // RENDER OPT JUSTIFICATION: DesktopAppDataGrid — memoizing columns keeps the grid stable across re-renders.
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
          return <input type="checkbox" checked={checked} onChange={e => onUserToggle(id, e.target.checked)} />;
        },
      },
      {
        field: "name",
        headerName: labels.columnName,
        flex: 1.5,
        minWidth: 200,
        renderCell: (params: { row: GroupUser }) => {
          const user = params.row;
          const profileHref = user.id ? profileHrefForUser(user.id) : undefined;
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
              <StyledUserAvatar>{userInitials(user.name)}</StyledUserAvatar>
              <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                {profileHref ? (
                  <Link href={profileHref} style={{ textDecoration: "none", color: "inherit" }}>
                    <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
                      {user.name}
                    </Typography>
                  </Link>
                ) : (
                  <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
                    {user.name}
                  </Typography>
                )}
                <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                  {user.email}
                </Typography>
              </Box>
            </Box>
          );
        },
      },
      {
        field: "assignedDate",
        headerName: labels.assignDate,
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
        headerName: labels.assignedBy,
        flex: 1,
        minWidth: 120,
        renderCell: () => (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {labels.assignedBySystem}
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
              {labels.removeUser}
            </StyledRemoveButton>
          </Box>
        ),
      },
    ];
  }, [
    group.createdAt,
    group.slug,
    selectedAssignedUserIds,
    onRevokeUser,
    onUserToggle,
    labels.columnName,
    labels.assignDate,
    labels.assignedBy,
    labels.assignedBySystem,
    labels.removeUser,
  ]);

  return (
    <DesktopSectionPanel title={labels.assignedGroupMembers}>
      <DesktopAppDataGrid<GroupUser>
        rows={filteredAssignedUsers}
        columns={assignedUsersColumns}
        getRowId={row => row.id ?? row.email ?? ""}
        emptyMessage={labels.noAssignedUsers}
        loading={loading ?? false}
        autoHeight
        paginationOptions={{ mode: "client" }}
      />
    </DesktopSectionPanel>
  );
}

export function AssignedUsersTabDesktop(props: Readonly<AssignedUsersTabProps>) {
  const t = useAppTranslation().dashboardTranslations.permissions;

  return (
    <AssignedUsersTabShared
      props={props}
      slots={{
        Toolbar: AssignedUsersDesktopToolbar,
        BulkActionBar: DesktopBulkActionBar,
        UsersList: AssignedUsersDataGrid,
      }}
      labels={{
        usersSelected: t.usersSelected,
        removeSelected: t.removeSelected,
        noAssignedUsers: t.noAssignedUsers,
        searchAssignedUsers: t.searchAssignedUsers,
        assignUsers: t.assignUsers,
        assignDate: t.assignedDate,
        removeUser: t.removeUser,
        assignedGroupMembers: t.assignedGroupMembers,
        columnName: t.columnName,
        assignedBy: t.assignedBy,
        assignedBySystem: t.assignedBySystem,
      }}
    />
  );
}
