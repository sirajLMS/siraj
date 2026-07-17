"use client";

import { Box, CircularProgress, Tab, Tabs } from "@mui/material";
import type { Permission, PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { LocalizedString } from "@/frontend/common/types/localized-string.types";
import type { SubTabKey } from "@/frontend/common/views/dashboard/permissions/components/useSingleGroupState";
import { useSingleGroupState } from "@/frontend/common/views/dashboard/permissions/components/useSingleGroupState";
import { AddPermissionsTabDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/addPermissionsTab.desktop";
import { AssignedUsersTabDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/assignedUsersTab.desktop";
import { CurrentPermissionsTabDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/currentPermissionsTab.desktop";
import { SingleGroupHeaderDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/singleGroupHeader.desktop";
import { useAppTranslation } from "@/shared/locale";

interface SingleGroupViewDesktopProps {
  readonly group: PermissionGroup;
  readonly permissions: readonly Permission[];
  readonly isLoading: boolean;
  readonly onBack: () => void;
  readonly onEditGroup: (id: string) => void;
  readonly onAssignGroup: (id: string) => void;
  readonly onRevokeGroup: (groupId: string, userId: string) => Promise<void>;
  readonly onBulkAssign: (groupId: string, userIds: string[]) => Promise<void>;
  readonly onBulkRevoke: (groupId: string, userIds: string[]) => Promise<void>;
  readonly onUpdateGroup: (
    id: string,
    name: LocalizedString,
    description: LocalizedString,
    permissionIds: string[]
  ) => Promise<void>;
}

export function SingleGroupViewDesktop({
  group,
  permissions,
  isLoading,
  onBack,
  onEditGroup,
  onAssignGroup,
  onRevokeGroup,
  onBulkRevoke,
  onUpdateGroup,
}: Readonly<SingleGroupViewDesktopProps>) {
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
      <SingleGroupHeaderDesktop group={group} onBack={onBack} onEditGroup={onEditGroup} />

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={activeSubTab}
          onChange={(_, val: SubTabKey) => handleSubTabChange(val)}
          textColor="primary"
          indicatorColor="primary"
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
            <CurrentPermissionsTabDesktop
              group={group}
              groupPermissions={groupPermissions}
              permissionsCount={permissionsCount}
              onRevokePermission={handleRevokePermission}
              onSwitchToAddTab={() => setActiveSubTab("add")}
              loading={isLoading}
            />
          )}

          {activeSubTab === "add" && !group.isSystem && (
            <AddPermissionsTabDesktop
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
            <AssignedUsersTabDesktop
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
