"use client";

import { useMemo } from "react";
import type { PermissionGroupDetailFieldsFragment as PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql";
import { useAssignGroupForm } from "@/frontend/common/views/dashboard/permissions/components/useAssignGroupForm";
import { useManageOverridesState } from "@/frontend/common/views/dashboard/permissions/components/useManageOverridesState";
import { usePermissionCatalogFilter } from "@/frontend/common/views/dashboard/permissions/components/usePermissionCatalogFilter";
import { usePermissionGroupForm } from "@/frontend/common/views/dashboard/permissions/components/usePermissionGroupForm";
import { useRowMenuAnchor } from "@/frontend/common/views/dashboard/permissions/components/useRowMenuAnchor";
import { useSingleGroupState } from "@/frontend/common/views/dashboard/permissions/components/useSingleGroupState";
import { usePermissionManagementData } from "@/frontend/common/views/dashboard/permissions/usePermissionManagementData";
import type {
  PermissionManagementDataBindings,
  PermissionManagementFormBindings,
  PermissionManagementFormParams,
  PermissionManagementSubViewBindings,
  PermissionManagementSubViewParams,
} from "@/frontend/common/views/dashboard/permissions/usePermissionManagementViewModel.types";

function resolveActiveGroup(
  groups: readonly PermissionGroup[],
  selectedGroupId: string | null
): PermissionGroup | null {
  return groups.find(g => g.id === selectedGroupId) ?? null;
}

/**
 * Wraps the Apollo query/mutation hook and renames its handlers to the flat
 * `on*` binding names the ViewModel exposes. `isDataLoading` is returned
 * separately because the ViewModel already owns a store-backed `isLoading`.
 */
export function usePermissionManagementDataBindings(): PermissionManagementDataBindings & {
  readonly isDataLoading: boolean;
} {
  const data = usePermissionManagementData();
  return {
    isDataLoading: data.isLoading,
    users: data.users,
    onCreateGroup: data.handleCreateGroup,
    onUpdateGroup: data.handleUpdateGroup,
    onDeleteGroup: data.handleDeleteGroup,
    onAssignGroup: data.handleAssignGroup,
    onRevokeGroup: data.handleRevokeGroup,
    onBulkAssign: data.handleBulkAssign,
    onBulkRevoke: data.handleBulkRevoke,
    onUpdateOverrides: data.handleUpdateOverrides,
  };
}

/**
 * Composes the create/edit group forms and the assign-group form so tier
 * dialog components receive bindings through props instead of owning form state.
 */
export function usePermissionManagementFormBindings(
  params: PermissionManagementFormParams
): PermissionManagementFormBindings {
  const createGroupForm = usePermissionGroupForm({
    open: params.isCreateDialogOpen,
    group: null,
    permissions: params.permissions,
    onSave: params.onCreateGroup,
  });
  const editGroupForm = usePermissionGroupForm({
    open: params.isEditDialogOpen,
    group: params.activeGroup,
    permissions: params.permissions,
    onSave: async (name, description, permissionIds) => {
      if (params.selectedGroupId) {
        await params.onUpdateGroup(params.selectedGroupId, name, description, permissionIds);
      }
    },
  });
  const assignGroupForm = useAssignGroupForm({ open: params.isAssignDialogOpen });
  return { createGroupForm, editGroupForm, assignGroupForm };
}

/**
 * Derives the selected group, catalog filter, single-group sub-view state,
 * manage-overrides dialog state and the shared row-menu anchor for the
 * group list popover. All values are returned as a flat prop bag.
 */
export function usePermissionManagementSubViewBindings(
  params: PermissionManagementSubViewParams
): PermissionManagementSubViewBindings {
  const activeGroup = useMemo(
    () => resolveActiveGroup(params.groups, params.selectedGroupId),
    [params.groups, params.selectedGroupId]
  );
  const catalogFilter = usePermissionCatalogFilter(params.permissions);
  const singleGroupState = useSingleGroupState({
    group: activeGroup,
    permissions: params.permissions,
    onRevokeGroup: params.onRevokeGroup,
    onBulkRevoke: params.onBulkRevoke,
    onUpdateGroup: params.onUpdateGroup,
  });
  const manageOverridesState = useManageOverridesState({
    userId: params.selectedUserIdForOverrides,
    users: params.users,
    groups: params.groups,
    permissions: params.permissions,
    isLoading: params.isDataLoading,
    open: params.isManageOverridesOpen,
    onClose: () => {
      params.setSelectedUserIdForOverrides(null);
      params.closeManageOverrides();
    },
    onSave: params.onUpdateOverrides,
  });
  const groupRowMenuAnchor = useRowMenuAnchor();
  return { activeGroup, catalogFilter, singleGroupState, manageOverridesState, groupRowMenuAnchor };
}
