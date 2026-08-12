"use client";

import { DeleteOutlined } from "@mui/icons-material";
import { Typography } from "@mui/material";
import {
  StyledBulkActionBar,
  StyledRemoveSelectedButton,
  StyledTabContainer,
} from "@/frontend/common/views/dashboard/permissions/components/assignedUsersTabShared.styles";
import type { AssignedUsersTabSharedProps } from "@/frontend/common/views/dashboard/permissions/types/assignedUsersTabShared.types";

export function AssignedUsersBulkActionBar({
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

export function AssignedUsersTabShared({ props, slots, labels }: Readonly<AssignedUsersTabSharedProps>) {
  return (
    <StyledTabContainer>
      <slots.Toolbar
        searchQuery={props.searchQuery}
        onSearchChange={props.onSearchChange}
        onAssignGroup={props.onAssignGroup}
        groupId={props.group.id}
        assignUsersLabel={labels.assignUsers}
        searchPlaceholder={labels.searchAssignedUsers}
        loading={props.loading ?? false}
      />
      {props.selectedAssignedUserIds.length > 0 ? (
        <slots.BulkActionBar
          selectedCount={props.selectedAssignedUserIds.length}
          onBulkRevokeUsers={props.onBulkRevokeUsers}
          usersSelectedLabel={labels.usersSelected}
          removeSelectedLabel={labels.removeSelected}
        />
      ) : null}
      <slots.UsersList props={props} labels={labels} />
    </StyledTabContainer>
  );
}
