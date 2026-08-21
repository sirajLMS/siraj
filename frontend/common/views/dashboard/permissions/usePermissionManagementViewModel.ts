"use client";

import { useMemo } from "react";
import type {
  PermissionsQuery_permissions as Permission,
  PermissionGroupDetailFieldsFragment as PermissionGroup,
  UsersQuery_users as User,
  UserOverridesQuery_userOverrides as UserOverride,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  type PermissionManagementTab,
  usePermissionManagementStore,
} from "@/frontend/common/stores/permissionManagementStore";
import {
  type AssignGroupFormBindings,
  useAssignGroupForm,
} from "@/frontend/common/views/dashboard/permissions/components/useAssignGroupForm";
import {
  type ManageOverridesState,
  useManageOverridesState,
} from "@/frontend/common/views/dashboard/permissions/components/useManageOverridesState";
import {
  type PermissionCatalogFilterResult,
  usePermissionCatalogFilter,
} from "@/frontend/common/views/dashboard/permissions/components/usePermissionCatalogFilter";
import {
  type PermissionGroupFormState,
  usePermissionGroupForm,
} from "@/frontend/common/views/dashboard/permissions/components/usePermissionGroupForm";
import {
  type RowMenuAnchor,
  useRowMenuAnchor,
} from "@/frontend/common/views/dashboard/permissions/components/useRowMenuAnchor";
import {
  type SingleGroupState,
  useSingleGroupState,
} from "@/frontend/common/views/dashboard/permissions/components/useSingleGroupState";
import { usePermissionManagementData } from "@/frontend/common/views/dashboard/permissions/usePermissionManagementData";
import { type PermissionsLabels, Translation, useAppTranslation } from "@/shared/locale";
import type { LocalizedString } from "@/shared/types";

export interface PermissionManagementViewModel {
  readonly labels: PermissionsLabels;
  readonly permissions: readonly Permission[];
  readonly groups: readonly PermissionGroup[];
  readonly overrides: readonly UserOverride[];
  readonly users: readonly User[];
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

  // NEW FOR PLAN v5: catalog filter state lifted out of
  // `permissionCatalogSection.{mobile,desktop}.tsx` (NS-2 N7 + N11 lift).
  readonly catalogFilter: PermissionCatalogFilterResult;

  // NEW FOR PLAN v5: form hooks lifted OUT of the tier dialog files into the
  // common hooks `usePermissionGroupForm` and `useAssignGroupForm` (NS-2 N4 +
  // N6 + N25 + N26 lift). The ViewModel composes them and the form bindings
  // flow down to the tier `<PermissionGroupForm…>` and `<AssignGroupDialog…>`
  // components as plain props.
  readonly createGroupForm: PermissionGroupFormState;
  readonly editGroupForm: PermissionGroupFormState;
  readonly assignGroupForm: AssignGroupFormBindings;

  // NEW FOR PLAN v5: pre-computed single-group sub-view state (NS-1/NS-2/NS-3
  // N26 lift). The tier `singleGroupView.{mobile,desktop}.tsx` files receive
  // the entire derived state bag as a plain prop — they no longer call
  // `useSingleGroupState(...)` directly.
  readonly singleGroupState: SingleGroupState;

  // NEW FOR PLAN v5: pre-computed manage-overrides dialog state (NS-1/NS-2/NS-3
  // N26 lift). The tier `manageOverridesDialog.{mobile,desktop}.tsx` files
  // receive the entire derived state bag as a plain prop — they no longer call
  // `useManageOverridesState(...)` directly.
  readonly manageOverridesState: ManageOverridesState;

  // NEW FOR PLAN v5: shared row-menu anchor state for the group list popover
  // (N7 lift). Previously held as `useState` in both tier card/grid row
  // components. Only one popover is open at a time across the list, so a
  // single shared anchor suffices. Tier row components receive `{ anchorEl,
  // openMenu, closeMenu }` callbacks as plain props.
  readonly groupRowMenuAnchor: RowMenuAnchor;

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

  readonly activeGroup: PermissionGroup | null;
  readonly activeTab: PermissionManagementTab;
  readonly selectedUserIdForOverrides: string | null;
  readonly setActiveTab: (tab: PermissionManagementTab) => void;
  readonly setSelectedUserIdForOverrides: (id: string | null) => void;
}

function resolveActiveGroup(
  groups: readonly PermissionGroup[],
  selectedGroupId: string | null
): PermissionGroup | null {
  return groups.find(g => g.id === selectedGroupId) ?? null;
}

/**
 * Plan v5 ViewModel for the Permissions management domain.
 *
 * Per specs §6.1 the Container instantiates this ViewModel with NO arguments;
 * the ViewModel sources its entire dependency set directly from the
 * `permissionManagementStore` (Zustand selectors) and from the internally
 * composed hooks (`usePermissionManagementData` for queries/mutations,
 * `usePermissionGroupForm`/`useAssignGroupForm` for form state,
 * `usePermissionCatalogFilter` for catalog filter state,
 * `useSingleGroupState`/`useManageOverridesState` for sub-view state,
 * `useRowMenuAnchor` for transient popover anchor state).
 *
 * The returned flat object flows down through the switcher into both tier
 * views (`permissionManagementView.{mobile,desktop}.tsx`) and their child
 * components. Tier files destructure fields and invoke callbacks — they never
 * call `useState`/`useQuery`/`useForm`/`use*State` directly.
 */
export function usePermissionManagementViewModel(): PermissionManagementViewModel {
  const labels = useAppTranslation(Translation.Dashboard.Permissions);
  // Store-backed state (reads) — single selector-per-field subscriptions.
  const error = usePermissionManagementStore(s => s.error);
  const isLoading = usePermissionManagementStore(s => s.isLoading);
  const permissions = usePermissionManagementStore(s => s.permissions);
  const groups = usePermissionManagementStore(s => s.groups);
  const overrides = usePermissionManagementStore(s => s.overrides);
  const selectedGroupId = usePermissionManagementStore(s => s.selectedGroupId);
  const selectedGroupIds = usePermissionManagementStore(s => s.selectedGroupIds);
  const selectedUserIds = usePermissionManagementStore(s => s.selectedUserIds);
  const selectedPermissionIds = usePermissionManagementStore(s => s.selectedPermissionIds);
  const isCreateDialogOpen = usePermissionManagementStore(s => s.isCreateDialogOpen);
  const isEditDialogOpen = usePermissionManagementStore(s => s.isEditDialogOpen);
  const isDeleteDialogOpen = usePermissionManagementStore(s => s.isDeleteDialogOpen);
  const isAssignDialogOpen = usePermissionManagementStore(s => s.isAssignDialogOpen);
  const isBulkRemoveUsersOpen = usePermissionManagementStore(s => s.isBulkRemoveUsersOpen);
  const isManageOverridesOpen = usePermissionManagementStore(s => s.isManageOverridesOpen);
  const activeTab = usePermissionManagementStore(s => s.activeTab);
  const selectedUserIdForOverrides = usePermissionManagementStore(s => s.selectedUserIdForOverrides);

  // Store-backed actions (setters / dialog openers / closers).
  const setSelectedGroupId = usePermissionManagementStore(s => s.setSelectedGroupId);
  const setSelectedGroupIds = usePermissionManagementStore(s => s.setSelectedGroupIds);
  const setSelectedUserIds = usePermissionManagementStore(s => s.setSelectedUserIds);
  const setSelectedPermissionIds = usePermissionManagementStore(s => s.setSelectedPermissionIds);
  const openCreateDialog = usePermissionManagementStore(s => s.openCreateDialog);
  const closeCreateDialog = usePermissionManagementStore(s => s.closeCreateDialog);
  const openEditDialog = usePermissionManagementStore(s => s.openEditDialog);
  const closeEditDialog = usePermissionManagementStore(s => s.closeEditDialog);
  const openDeleteDialog = usePermissionManagementStore(s => s.openDeleteDialog);
  const closeDeleteDialog = usePermissionManagementStore(s => s.closeDeleteDialog);
  const openAssignDialog = usePermissionManagementStore(s => s.openAssignDialog);
  const closeAssignDialog = usePermissionManagementStore(s => s.closeAssignDialog);
  const openBulkRemoveUsers = usePermissionManagementStore(s => s.openBulkRemoveUsers);
  const closeBulkRemoveUsers = usePermissionManagementStore(s => s.closeBulkRemoveUsers);
  const openManageOverrides = usePermissionManagementStore(s => s.openManageOverrides);
  const closeManageOverrides = usePermissionManagementStore(s => s.closeManageOverrides);
  const setActiveTab = usePermissionManagementStore(s => s.setActiveTab);
  const setSelectedUserIdForOverrides = usePermissionManagementStore(s => s.setSelectedUserIdForOverrides);

  // Mutations + queries (Apollo + handlers) — composed via the common data hook.
  const {
    users,
    isLoading: dataLoading,
    handleCreateGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    handleAssignGroup,
    handleRevokeGroup,
    handleBulkAssign,
    handleBulkRevoke,
    handleUpdateOverrides,
  } = usePermissionManagementData();

  const activeGroup = useMemo<PermissionGroup | null>(
    () => resolveActiveGroup(groups, selectedGroupId),
    [groups, selectedGroupId]
  );

  // NEW FOR PLAN v5: catalog filter hook composed by the ViewModel — derived
  // categories + filteredPermissions flow down to the tier
  // `PermissionCatalogSection{Mobile,Desktop}` components as props.
  const catalogFilter = usePermissionCatalogFilter(permissions);

  // NEW FOR PLAN v5: form hooks lifted OUT of the tier dialog files. The VM
  // composes shared form hooks from common so the tier dialog components only
  // touch bindings (control/handleSubmit/errors) via props (specs §6.2).
  const createGroupForm = usePermissionGroupForm({
    open: isCreateDialogOpen,
    group: null,
    permissions,
    onSave: handleCreateGroup,
  });
  const editGroupForm = usePermissionGroupForm({
    open: isEditDialogOpen,
    group: activeGroup,
    permissions,
    onSave: async (name, description, permissionIds) => {
      if (selectedGroupId) {
        await handleUpdateGroup(selectedGroupId, name, description, permissionIds);
      }
    },
  });
  const assignGroupForm = useAssignGroupForm({ open: isAssignDialogOpen });

  // NEW FOR PLAN v5: pre-computed single-group sub-view state composed by the
  // ViewModel. The tier `singleGroupView.{mobile,desktop}.tsx` files consume
  // the flat bag as a plain prop instead of calling `useSingleGroupState(...)`
  // themselves (specs §6.2 — sub-view state composition belongs in the VM).
  // Called unconditionally (rules-of-hooks) — `useSingleGroupState` accepts a
  // nullable `group` and short-circuits its derivation helpers when null. The
  // parent view only reads `singleGroupState` when `activeGroup` is non-null.
  const singleGroupState = useSingleGroupState({
    group: activeGroup,
    permissions,
    onRevokeGroup: handleRevokeGroup,
    onBulkRevoke: handleBulkRevoke,
    onUpdateGroup: handleUpdateGroup,
  });

  // NEW FOR PLAN v5: pre-computed manage-overrides dialog state composed by the
  // ViewModel. The tier `manageOverridesDialog.{mobile,desktop}.tsx` files
  // consume the flat bag as a plain prop instead of calling
  // `useManageOverridesState(...)` themselves (specs §6.2).
  const manageOverridesState = useManageOverridesState({
    userId: selectedUserIdForOverrides,
    users,
    groups,
    permissions,
    isLoading: dataLoading,
    open: isManageOverridesOpen,
    onClose: () => {
      setSelectedUserIdForOverrides(null);
      closeManageOverrides();
    },
    onSave: handleUpdateOverrides,
  });

  // NEW FOR PLAN v5: shared row-menu anchor for the group list popover. Only
  // one popover is open at a time across the list — a single shared anchor
  // state suffices. The tier card/grid row components receive `{ anchorEl,
  // openMenu, closeMenu }` as plain props.
  const groupRowMenuAnchor = useRowMenuAnchor();

  return {
    labels,
    permissions,
    groups,
    overrides,
    users,
    selectedGroupId,
    selectedGroupIds,
    selectedUserIds,
    selectedPermissionIds,
    isLoading,
    error,
    catalogFilter,
    createGroupForm,
    editGroupForm,
    assignGroupForm,
    singleGroupState,
    manageOverridesState,
    groupRowMenuAnchor,
    isCreateDialogOpen,
    isEditDialogOpen,
    isDeleteDialogOpen,
    isAssignDialogOpen,
    isBulkRemoveUsersOpen,
    isManageOverridesOpen,

    setSelectedGroupId,
    setSelectedGroupIds,
    setSelectedUserIds,
    setSelectedPermissionIds,

    openCreateDialog,
    closeCreateDialog,
    openEditDialog,
    closeEditDialog,
    openDeleteDialog,
    closeDeleteDialog,
    openAssignDialog,
    closeAssignDialog,
    openBulkRemoveUsers,
    closeBulkRemoveUsers,
    openManageOverrides,
    closeManageOverrides,

    onCreateGroup: handleCreateGroup,
    onUpdateGroup: handleUpdateGroup,
    onDeleteGroup: handleDeleteGroup,
    onAssignGroup: handleAssignGroup,
    onRevokeGroup: handleRevokeGroup,
    onBulkAssign: handleBulkAssign,
    onBulkRevoke: handleBulkRevoke,
    onUpdateOverrides: handleUpdateOverrides,

    activeGroup,
    activeTab,
    selectedUserIdForOverrides,
    setActiveTab,
    setSelectedUserIdForOverrides,
  };
}
