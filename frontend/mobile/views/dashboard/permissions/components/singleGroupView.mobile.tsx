"use client";

import { Box, CircularProgress, Tab, Tabs } from "@mui/material";
import type { SubTabKey } from "@/frontend/common/views/dashboard/permissions/components/useSingleGroupState";
import { useSingleGroupState } from "@/frontend/common/views/dashboard/permissions/components/useSingleGroupState";
import type { SingleGroupViewProps } from "@/frontend/common/views/dashboard/permissions/types";
import { AddPermissionsTabMobile } from "@/frontend/mobile/views/dashboard/permissions/components/addPermissionsTab.mobile";
import { AssignedUsersTabMobile } from "@/frontend/mobile/views/dashboard/permissions/components/assignedUsersTab.mobile";
import { CurrentPermissionsTabMobile } from "@/frontend/mobile/views/dashboard/permissions/components/currentPermissionsTab.mobile";
import { SingleGroupHeaderMobile } from "@/frontend/mobile/views/dashboard/permissions/components/singleGroupHeader.mobile";
import { useAppTranslation } from "@/shared/locale";

export function SingleGroupViewMobile({
  group,
  permissions,
  isLoading,
  onBack,
  onEditGroup,
  onAssignGroup,
  onRevokeGroup,
  onBulkRevoke,
  onUpdateGroup,
}: Readonly<SingleGroupViewProps>) {
  const t = useAppTranslation().dashboardTranslations.permissions;
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
  } = useSingleGroupState({ group, permissions, onRevokeGroup, onBulkRevoke, onUpdateGroup });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <SingleGroupHeaderMobile group={group} onBack={onBack} onEditGroup={onEditGroup} />

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={activeSubTab}
          onChange={(_, val: SubTabKey) => handleSubTabChange(val)}
          textColor="primary"
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            value="current"
            label={`${t.currentPermissions} (${permissionsCount})`}
            sx={{ textTransform: "none", fontWeight: 600 }}
          />
          {!group.isSystem && (
            <Tab value="add" label={t.addPermissions} sx={{ textTransform: "none", fontWeight: 600 }} />
          )}
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
            <CurrentPermissionsTabMobile
              group={group}
              groupPermissions={groupPermissions}
              permissionsCount={permissionsCount}
              onRevokePermission={handleRevokePermission}
              onSwitchToAddTab={() => setActiveSubTab("add")}
              loading={isLoading}
            />
          )}

          {activeSubTab === "add" && !group.isSystem && (
            <AddPermissionsTabMobile
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
            <AssignedUsersTabMobile
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
