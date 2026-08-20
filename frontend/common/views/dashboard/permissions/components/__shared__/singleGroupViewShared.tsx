"use client";

import { Box, CircularProgress, Tab, Tabs } from "@mui/material";
import type { ComponentType } from "react";
import type { SubTabKey } from "@/frontend/common/views/dashboard/permissions/components/useSingleGroupState";
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

      <Box sx={theme => ({ borderBottom: `1px solid ${theme.palette.divider}` })}>
        <Tabs
          value={activeSubTab}
          onChange={(_, val: SubTabKey) => handleSubTabChange(val)}
          textColor="primary"
          indicatorColor="primary"
          variant={options.tabsVariant}
          scrollButtons={options.scrollButtons}
        >
          <Tab
            value="current"
            label={`${t.currentPermissions} (${permissionsCount})`}
            sx={{ textTransform: "none", fontWeight: 600 }}
          />
          <Tab value="add" label={t.addPermissions} sx={{ textTransform: "none", fontWeight: 600 }} />
          <Tab
            value="users"
            label={`${t.assignedUsers} (${assignedUsersCount})`}
            sx={{ textTransform: "none", fontWeight: 600 }}
          />
        </Tabs>
      </Box>

      {isLoading && !permissions && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress color="primary" />
        </Box>
      )}

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
