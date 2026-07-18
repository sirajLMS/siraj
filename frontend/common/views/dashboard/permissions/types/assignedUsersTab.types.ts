// NEW FOR PLAN v5 (newly created for the migration wave)
import type { GroupUser, PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";

export interface AssignedUsersTabProps {
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
