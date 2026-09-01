import type React from "react";
import type { AssignedUsersTabProps } from "@/frontend/common/views/dashboard/permissions/types/assignedUsersTab.types";

interface AssignedUsersToolbarSlotProps {
  readonly searchQuery: string;
  readonly onSearchChange: (value: string) => void;
  readonly onAssignGroup: (id: string) => void;
  readonly groupId: string | null | undefined;
  readonly assignUsersLabel: string;
  readonly searchPlaceholder: string;
  readonly loading: boolean;
}

interface AssignedUsersBulkActionBarSlotProps {
  readonly selectedCount: number;
  readonly onBulkRevokeUsers: () => void;
  readonly usersSelectedLabel: (count: number) => string;
  readonly removeSelectedLabel: string;
}

interface AssignedUsersListSlotLabels {
  readonly assignDate: string;
  readonly removeUser: string;
  readonly usersSelected: (count: number) => string;
  readonly removeSelected: string;
  readonly noAssignedUsers: string;
  readonly searchAssignedUsers: string;
  readonly assignUsers: string;
  readonly assignedGroupMembers: string;
  readonly columnName: string;
  readonly assignedBy: string;
  readonly assignedBySystem: string;
}

export interface AssignedUsersListSlotProps {
  readonly props: AssignedUsersTabProps;
  readonly labels: AssignedUsersListSlotLabels;
}

interface AssignedUsersTabSlotProps {
  readonly Toolbar: React.ComponentType<AssignedUsersToolbarSlotProps>;
  readonly BulkActionBar: React.ComponentType<AssignedUsersBulkActionBarSlotProps>;
  readonly UsersList: React.ComponentType<AssignedUsersListSlotProps>;
}

export interface AssignedUsersTabSharedLabels {
  readonly usersSelected: (count: number) => string;
  readonly removeSelected: string;
  readonly noAssignedUsers: string;
  readonly searchAssignedUsers: string;
  readonly assignUsers: string;
  readonly assignDate: string;
  readonly removeUser: string;
  readonly assignedGroupMembers: string;
  readonly columnName: string;
  readonly assignedBy: string;
  readonly assignedBySystem: string;
}

export interface AssignedUsersTabSharedProps {
  readonly props: Readonly<AssignedUsersTabProps>;
  readonly slots: AssignedUsersTabSlotProps;
  readonly labels: AssignedUsersTabSharedLabels;
}
