// NEW FOR PLAN v5 (newly created for the migration wave)
import type {
  PermissionGroupDetailFieldsFragment,
  PermissionGroupDetailFieldsFragment_assignedUsers,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { PermissionsLabels } from "@/shared/locale";

export interface AssignedUsersTabProps {
  readonly labels: PermissionsLabels;
  readonly group: PermissionGroupDetailFieldsFragment;
  readonly filteredAssignedUsers: readonly PermissionGroupDetailFieldsFragment_assignedUsers[];
  readonly selectedAssignedUserIds: readonly string[];
  readonly searchQuery: string;
  readonly onBulkRevokeUsers: () => void;
  readonly onRevokeUser: (userId: string) => void;
  readonly onUserToggle: (id: string, checked: boolean) => void;
  readonly onSearchChange: (value: string) => void;
  readonly onAssignGroup: (id: string) => void;
  readonly loading?: boolean;
}
