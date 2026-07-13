import { create } from "zustand";
import type { Permission, PermissionGroup, UserOverride } from "@/frontend/common/graphql/generated/gql/graphql-types";

export type PermissionManagementTab = "groups" | "catalog" | "overrides";

interface PermissionManagementState {
  // Data
  permissions: Permission[];
  groups: PermissionGroup[];
  overrides: UserOverride[];

  // UI Selection State
  selectedGroupId: string | null;
  selectedGroupIds: string[];
  selectedUserIds: string[];
  selectedPermissionIds: string[];

  // Loading/Error
  isLoading: boolean;
  error: string | null;

  // Dialog States
  isCreateDialogOpen: boolean;
  isCreateGroupOpen: boolean; // Alias for compatibility
  isEditDialogOpen: boolean;
  isDeleteDialogOpen: boolean;
  isAssignDialogOpen: boolean;
  isBulkRemoveUsersOpen: boolean;
  isManageOverridesOpen: boolean;

  // Mobile/desktop tier-shared state (survives viewport tier switching)
  activeTab: PermissionManagementTab;
  selectedUserIdForOverrides: string | null;

  // Setters
  setPermissions: (permissions: Permission[]) => void;
  setGroups: (groups: PermissionGroup[]) => void;
  setOverrides: (overrides: UserOverride[]) => void;

  setSelectedGroupId: (id: string | null) => void;
  setSelectedGroupIds: (ids: string[]) => void;
  setSelectedUserIds: (ids: string[]) => void;
  setSelectedPermissionIds: (ids: string[]) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Dialog Actions
  openCreateDialog: () => void;
  closeCreateDialog: () => void;
  openEditDialog: (groupId: string) => void;
  closeEditDialog: () => void;
  openDeleteDialog: (groupId: string) => void;
  closeDeleteDialog: () => void;
  openAssignDialog: (groupId: string) => void;
  closeAssignDialog: () => void;

  openBulkRemoveUsers: () => void;
  closeBulkRemoveUsers: () => void;
  openManageOverrides: () => void;
  closeManageOverrides: () => void;

  // Tier-shared state setters
  setActiveTab: (tab: PermissionManagementTab) => void;
  setSelectedUserIdForOverrides: (id: string | null) => void;

  reset: () => void;
}

const initialState = {
  permissions: [] as Permission[],
  groups: [] as PermissionGroup[],
  overrides: [] as UserOverride[],
  selectedGroupId: null,
  selectedGroupIds: [] as string[],
  selectedUserIds: [] as string[],
  selectedPermissionIds: [] as string[],
  isLoading: false,
  error: null,
  isCreateDialogOpen: false,
  isCreateGroupOpen: false,
  isEditDialogOpen: false,
  isDeleteDialogOpen: false,
  isAssignDialogOpen: false,
  isBulkRemoveUsersOpen: false,
  isManageOverridesOpen: false,
  activeTab: "groups" as PermissionManagementTab,
  selectedUserIdForOverrides: null,
};

export const usePermissionManagementStore = create<PermissionManagementState>(set => ({
  ...initialState,
  setPermissions: permissions => set({ permissions }),
  setGroups: groups => set({ groups }),
  setOverrides: overrides => set({ overrides }),

  setSelectedGroupId: id => set({ selectedGroupId: id }),
  setSelectedGroupIds: ids => set({ selectedGroupIds: ids }),
  setSelectedUserIds: ids => set({ selectedUserIds: ids }),
  setSelectedPermissionIds: ids => set({ selectedPermissionIds: ids }),

  setLoading: loading => set({ isLoading: loading }),
  setError: error => set({ error }),

  openCreateDialog: () => set({ isCreateDialogOpen: true, isCreateGroupOpen: true }),
  closeCreateDialog: () => set({ isCreateDialogOpen: false, isCreateGroupOpen: false }),

  openEditDialog: groupId => set({ isEditDialogOpen: true, selectedGroupId: groupId }),
  closeEditDialog: () => set({ isEditDialogOpen: false, selectedGroupId: null }),

  openDeleteDialog: groupId => set({ isDeleteDialogOpen: true, selectedGroupId: groupId }),
  closeDeleteDialog: () => set({ isDeleteDialogOpen: false, selectedGroupId: null }),

  openAssignDialog: groupId => set({ isAssignDialogOpen: true, selectedGroupId: groupId }),
  closeAssignDialog: () => set({ isAssignDialogOpen: false, selectedGroupId: null }),

  openBulkRemoveUsers: () => set({ isBulkRemoveUsersOpen: true }),
  closeBulkRemoveUsers: () => set({ isBulkRemoveUsersOpen: false }),

  openManageOverrides: () => set({ isManageOverridesOpen: true }),
  closeManageOverrides: () => set({ isManageOverridesOpen: false }),

  setActiveTab: tab => set({ activeTab: tab }),
  setSelectedUserIdForOverrides: id => set({ selectedUserIdForOverrides: id }),

  reset: () => set(initialState),
}));
