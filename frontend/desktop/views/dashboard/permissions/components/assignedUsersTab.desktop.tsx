"use client";

import { PersonAddOutlined, PersonRemoveOutlined } from "@mui/icons-material";
import { Box, Button, Checkbox, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { ViewAsUserButton } from "@/frontend/common/components/auth/ViewAsUserButton";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
import type { PermissionGroupDetailFieldsFragment_assignedUsers } from "@/frontend/common/graphql/generated/gql/graphql";
import { profileHrefForUser } from "@/frontend/common/utils/profileHref";
import {
  AssignedUsersBulkActionBar,
  AssignedUsersTabShared,
} from "@/frontend/common/views/dashboard/permissions/components/assignedUsersTabShared";
import {
  StyledRemoveButton,
  StyledUserToolbar,
} from "@/frontend/common/views/dashboard/permissions/components/assignedUsersTabShared.styles";
import type { AssignedUsersTabProps } from "@/frontend/common/views/dashboard/permissions/types/assignedUsersTab.types";
import type { AssignedUsersListSlotProps } from "@/frontend/common/views/dashboard/permissions/types/assignedUsersTabShared.types";
import { assignedUsersTabLabels } from "@/frontend/common/views/dashboard/permissions/utils";
import { DesktopAppDataGrid, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui/display";

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
      <Box sx={{ width: 360 }}>
        <SearchBarField value={searchQuery} placeholder={searchPlaceholder} onChange={onSearchChange} />
      </Box>
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

function AssignedUsersDataGrid({ props, labels }: Readonly<AssignedUsersListSlotProps>) {
  const { group, filteredAssignedUsers, selectedAssignedUserIds, onRevokeUser, onUserToggle, loading } = props;

  // RENDER OPT JUSTIFICATION: DesktopAppDataGrid — memoizing columns keeps the grid stable across re-renders.
  const assignedUsersColumns = useMemo<GridColDef<PermissionGroupDetailFieldsFragment_assignedUsers>[]>(() => {
    return [
      {
        field: "checkbox",
        headerName: "",
        width: 50,
        sortable: false,
        renderCell: (params: { row: PermissionGroupDetailFieldsFragment_assignedUsers }) => {
          const id = params.row.id ?? "";
          const checked = selectedAssignedUserIds.includes(id);
          return (
            <Checkbox
              checked={checked}
              onChange={e => onUserToggle(id, e.target.checked)}
              aria-label={params.row.name ?? params.row.email ?? ""}
              size="small"
            />
          );
        },
      },
      {
        field: "name",
        headerName: labels.columnName,
        flex: 1.5,
        minWidth: 200,
        renderCell: (params: { row: PermissionGroupDetailFieldsFragment_assignedUsers }) => {
          const user = params.row;
          return (
            <Box sx={{ display: "flex", alignItems: "center", py: 1, height: "100%" }}>
              <DesktopPersonProfileLinkCell
                href={user.id ? profileHrefForUser(user.id) : undefined}
                name={user.name ?? ""}
                avatarSize={32}
                label={user.email ?? undefined}
                typographyVariant="bodyMd"
                fontWeight={600}
              />
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
    <DesktopSectionPanel contentPadding={false} title={labels.assignedGroupMembers}>
      <DesktopAppDataGrid<PermissionGroupDetailFieldsFragment_assignedUsers>
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
  return (
    <AssignedUsersTabShared
      props={props}
      slots={{
        Toolbar: AssignedUsersDesktopToolbar,
        BulkActionBar: AssignedUsersBulkActionBar,
        UsersList: AssignedUsersDataGrid,
      }}
      labels={assignedUsersTabLabels(props.labels)}
    />
  );
}
