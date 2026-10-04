"use client";

import { Box } from "@mui/material";
import type { ComponentType } from "react";
import {
  GroupLoadingIndicator,
  GroupSubTabs,
} from "@/frontend/common/views/dashboard/permissions/components/__shared__/singleGroupViewShared.parts";
import type {
  AddPermissionsTabProps,
  AssignedUsersTabProps,
  CurrentPermissionsTabProps,
  SingleGroupHeaderProps,
  SingleGroupViewProps,
} from "@/frontend/common/views/dashboard/permissions/types";

export interface SingleGroupViewSharedOptions {
  readonly tabsVariant?: "standard" | "scrollable" | "fullWidth";
  readonly scrollButtons?: "auto" | true | false;
}

export interface SingleGroupViewSharedSlots {
  readonly SingleGroupHeader: ComponentType<Readonly<SingleGroupHeaderProps>>;
  readonly CurrentPermissionsTab: ComponentType<Readonly<CurrentPermissionsTabProps>>;
  readonly AddPermissionsTab: ComponentType<Readonly<AddPermissionsTabProps>>;
  readonly AssignedUsersTab: ComponentType<Readonly<AssignedUsersTabProps>>;
}

export function SingleGroupViewShared({
  labels,
  group,
  permissions,
  isLoading,
  onBack,
  onEditGroup,
  onAssignGroup,
  singleGroupState,
  options,
  slots,
}: Readonly<SingleGroupViewProps & { options: SingleGroupViewSharedOptions; slots: SingleGroupViewSharedSlots }>) {
  const t = labels;
  const {
    activeSubTab,
    setActiveSubTab,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedAddPermissionIds,
    selectedAssignedUserIds,
    groupPermissions,
    addCategories,
    filteredAvailablePermissions,
    filteredAssignedUsers,
    permissionsCount,
    assignedUsersCount,
    handleRevokePermission,
    handleAssignPermissions,
    handleRevokeUser,
    handleBulkRevokeUsers,
    handleAddPermissionToggle,
    handleAssignedUserToggle,
    handleSubTabChange,
  } = singleGroupState;
  const { SingleGroupHeader, CurrentPermissionsTab, AddPermissionsTab, AssignedUsersTab } = slots;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <SingleGroupHeader labels={labels} group={group} onBack={onBack} onEditGroup={onEditGroup} />

      <GroupSubTabs
        t={t}
        activeSubTab={activeSubTab}
        onSubTabChange={handleSubTabChange}
        permissionsCount={permissionsCount}
        assignedUsersCount={assignedUsersCount}
        options={options}
      />

      {isLoading && !permissions && <GroupLoadingIndicator />}

      {(!isLoading || permissions) && (
        <Box sx={{ mt: 1 }}>
          {activeSubTab === "current" && (
            <CurrentPermissionsTab
              labels={labels}
              group={group}
              groupPermissions={groupPermissions}
              permissionsCount={permissionsCount}
              onRevokePermission={handleRevokePermission}
              onSwitchToAddTab={() => setActiveSubTab("add")}
              loading={isLoading}
            />
          )}

          {activeSubTab === "add" && (
            <AddPermissionsTab
              labels={labels}
              filteredAvailablePermissions={filteredAvailablePermissions}
              selectedAddPermissionIds={selectedAddPermissionIds}
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              addCategories={addCategories}
              onAssignPermissions={handleAssignPermissions}
              onPermissionToggle={handleAddPermissionToggle}
              onSearchChange={setSearchQuery}
              onCategoryChange={setSelectedCategory}
              loading={isLoading}
            />
          )}

          {activeSubTab === "users" && (
            <AssignedUsersTab
              labels={labels}
              group={group}
              filteredAssignedUsers={filteredAssignedUsers}
              selectedAssignedUserIds={selectedAssignedUserIds}
              searchQuery={searchQuery}
              onBulkRevokeUsers={handleBulkRevokeUsers}
              onRevokeUser={handleRevokeUser}
              onUserToggle={handleAssignedUserToggle}
              onSearchChange={setSearchQuery}
              onAssignGroup={onAssignGroup}
              loading={isLoading}
            />
          )}
        </Box>
      )}
    </Box>
  );
}
