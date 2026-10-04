import type {
  PermissionsQuery_permissions as Permission,
  PermissionGroupDetailFieldsFragment as PermissionGroup,
  UsersQuery_users as User,
  UserOverridesQuery_userOverrides as UserOverride,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { PermissionManagementTab } from "@/frontend/common/stores/permissionManagementStore";
import type { AssignGroupFormBindings } from "@/frontend/common/views/dashboard/permissions/components/useAssignGroupForm";
import type { ManageOverridesState } from "@/frontend/common/views/dashboard/permissions/components/useManageOverridesState";
import type { PermissionCatalogFilterResult } from "@/frontend/common/views/dashboard/permissions/components/usePermissionCatalogFilter";
import type { PermissionGroupFormState } from "@/frontend/common/views/dashboard/permissions/components/usePermissionGroupForm";
import type { RowMenuAnchor } from "@/frontend/common/views/dashboard/permissions/components/useRowMenuAnchor";
import type { SingleGroupState } from "@/frontend/common/views/dashboard/permissions/components/useSingleGroupState";
import type { LocalizedString } from "@/shared/types";

export interface PermissionManagementStoreState {
  readonly permissions: readonly Permission[];
  readonly groups: readonly PermissionGroup[];
  readonly overrides: readonly UserOverride[];
  readonly selectedGroupId: string | null;
  readonly selectedGroupIds: readonly string[];
  readonly selectedUserIds: readonly string[];
  readonly selectedPermissionIds: string[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isCreateDialogOpen: boolean;
  readonly isEditDialogOpen: boolean;
  readonly isDeleteDialogOpen: boolean;
  readonly isAssignDialogOpen: boolean;
  readonly isBulkRemoveUsersOpen: boolean;
  readonly isManageOverridesOpen: boolean;
  readonly activeTab: PermissionManagementTab;
  readonly selectedUserIdForOverrides: string | null;
}

export interface PermissionManagementStoreActions {
  readonly setSelectedGroupId: (id: string | null) => void;
  readonly setSelectedGroupIds: (ids: string[]) => void;
  readonly setSelectedUserIds: (ids: string[]) => void;
  readonly setSelectedPermissionIds: (ids: string[]) => void;
  readonly openCreateDialog: () => void;
  readonly closeCreateDialog: () => void;
  readonly openEditDialog: (id: string) => void;
  readonly closeEditDialog: () => void;
  readonly openDeleteDialog: (id: string) => void;
  readonly closeDeleteDialog: () => void;
  readonly openAssignDialog: (id: string) => void;
  readonly closeAssignDialog: () => void;
  readonly openBulkRemoveUsers: () => void;
  readonly closeBulkRemoveUsers: () => void;
  readonly openManageOverrides: () => void;
  readonly closeManageOverrides: () => void;
  readonly setActiveTab: (tab: PermissionManagementTab) => void;
  readonly setSelectedUserIdForOverrides: (id: string | null) => void;
}

export interface PermissionManagementDataBindings {
  readonly users: readonly User[];
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
  readonly onRevokeGroup: (groupId: string, userId: string) => Promise<void>;
  readonly onBulkAssign: (groupId: string, userIds: string[]) => Promise<void>;
  readonly onBulkRevoke: (groupId: string, userIds: string[]) => Promise<void>;
  readonly onUpdateOverrides: (
    userId: string,
    overrides: Array<{ permissionId: string; state: string }>
  ) => Promise<void>;
}

export interface PermissionManagementFormBindings {
  readonly createGroupForm: PermissionGroupFormState;
  readonly editGroupForm: PermissionGroupFormState;
  readonly assignGroupForm: AssignGroupFormBindings;
}

export interface PermissionManagementSubViewBindings {
  readonly activeGroup: PermissionGroup | null;
  readonly catalogFilter: PermissionCatalogFilterResult;
  readonly singleGroupState: SingleGroupState;
  readonly manageOverridesState: ManageOverridesState;
  readonly groupRowMenuAnchor: RowMenuAnchor;
}

export interface PermissionManagementFormParams {
  readonly permissions: readonly Permission[];
  readonly isCreateDialogOpen: boolean;
  readonly isEditDialogOpen: boolean;
  readonly isAssignDialogOpen: boolean;
  readonly activeGroup: PermissionGroup | null;
  readonly selectedGroupId: string | null;
  readonly onCreateGroup: PermissionManagementDataBindings["onCreateGroup"];
  readonly onUpdateGroup: PermissionManagementDataBindings["onUpdateGroup"];
}

export interface PermissionManagementSubViewParams {
  readonly permissions: readonly Permission[];
  readonly groups: readonly PermissionGroup[];
  readonly users: readonly User[];
  readonly selectedGroupId: string | null;
  readonly selectedUserIdForOverrides: string | null;
  readonly isManageOverridesOpen: boolean;
  readonly isDataLoading: boolean;
  readonly onRevokeGroup: PermissionManagementDataBindings["onRevokeGroup"];
  readonly onBulkRevoke: PermissionManagementDataBindings["onBulkRevoke"];
  readonly onUpdateGroup: PermissionManagementDataBindings["onUpdateGroup"];
  readonly onUpdateOverrides: PermissionManagementDataBindings["onUpdateOverrides"];
  readonly setSelectedUserIdForOverrides: (id: string | null) => void;
  readonly closeManageOverrides: () => void;
}
