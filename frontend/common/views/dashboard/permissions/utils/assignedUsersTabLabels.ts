import type { AssignedUsersTabProps } from "@/frontend/common/views/dashboard/permissions/types/assignedUsersTab.types";
import type { AssignedUsersTabSharedLabels } from "@/frontend/common/views/dashboard/permissions/types/assignedUsersTabShared.types";

export function assignedUsersTabLabels(t: Readonly<AssignedUsersTabProps["labels"]>): AssignedUsersTabSharedLabels {
  return {
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
  };
}
