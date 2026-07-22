"use client";

import { StyledTabContainer } from "@/frontend/common/views/dashboard/permissions/components/assignedUsersTabShared.styles";
import type { AssignedUsersTabSharedProps } from "@/frontend/common/views/dashboard/permissions/types/assignedUsersTabShared.types";

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
