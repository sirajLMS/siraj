// NEW FOR PLAN v5 (newly created for the migration wave)
import type { Permission, PermissionGroup, User } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { LocalizedString } from "@/frontend/common/types/localized-string.types";

export interface PermissionManagementDialogsProps {
  readonly permissions: readonly Permission[];
  readonly groups: readonly PermissionGroup[];
  readonly users: readonly User[];
  readonly isLoading: boolean;
  readonly activeGroup: PermissionGroup | null;
  readonly selectedGroupId: string | null;
  readonly selectedUserIdForOverrides: string | null;
  readonly isCreateDialogOpen: boolean;
  readonly isEditDialogOpen: boolean;
  readonly isDeleteDialogOpen: boolean;
  readonly isAssignDialogOpen: boolean;
  readonly isManageOverridesOpen: boolean;
  readonly closeCreateDialog: () => void;
  readonly closeEditDialog: () => void;
  readonly closeDeleteDialog: () => void;
  readonly closeAssignDialog: () => void;
  readonly closeManageOverrides: () => void;
  readonly setSelectedUserIdForOverrides: (id: string | null) => void;
  readonly onCreateGroup: (
    name: LocalizedString,
    description: LocalizedString,
    permissionIds: string[]
  ) => Promise<void>;
  readonly onUpdateGroup: (
    id: string,
    name: LocalizedString,
    description: LocalizedString,
    permissionIds: string[]
  ) => Promise<void>;
  readonly onDeleteGroup: (id: string) => Promise<void>;
  readonly onAssignGroup: (groupId: string, userId: string) => Promise<void>;
  readonly onUpdateOverrides: (
    userId: string,
    overrides: Array<{ permissionId: string; state: string }>
  ) => Promise<void>;
}
