"use client";

import { PersonAddOutlined } from "@mui/icons-material";
import { Box, Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useMemo } from "react";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
import type { PermissionGroupDetailFieldsFragment_assignedUsers } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  AssignedUsersBulkActionBar,
  AssignedUsersTabShared,
} from "@/frontend/common/views/dashboard/permissions/components/assignedUsersTabShared";
import { StyledUserToolbar } from "@/frontend/common/views/dashboard/permissions/components/assignedUsersTabShared.styles";
import type { AssignedUsersTabProps } from "@/frontend/common/views/dashboard/permissions/types/assignedUsersTab.types";
import type { AssignedUsersListSlotProps } from "@/frontend/common/views/dashboard/permissions/types/assignedUsersTabShared.types";
import { assignedUsersTabLabels } from "@/frontend/common/views/dashboard/permissions/utils";
import { DesktopAppDataGrid, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { buildAssignedUsersColumns } from "@/frontend/desktop/views/dashboard/permissions/components/assignedUsersTab.columns";

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

  const assignedUsersColumns = useMemo(
    () => buildAssignedUsersColumns({ group, selectedAssignedUserIds, onRevokeUser, onUserToggle, labels }),
    [group, selectedAssignedUserIds, onRevokeUser, onUserToggle, labels]
  );

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
