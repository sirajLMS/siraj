"use client";

import { Box, CircularProgress, Tab, Tabs } from "@mui/material";
import { useTranslations } from "next-intl";
import type { Permission, PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { LocalizedString } from "@/frontend/common/types/localized-string.types";
import { AddPermissionsTab } from "@/frontend/common/views/dashboard/permissions/components/AddPermissionsTab";
import { AssignedUsersTab } from "@/frontend/common/views/dashboard/permissions/components/AssignedUsersTab";
import { CurrentPermissionsTab } from "@/frontend/common/views/dashboard/permissions/components/CurrentPermissionsTab";
import { SingleGroupHeader } from "@/frontend/common/views/dashboard/permissions/components/SingleGroupHeader";
import type { SubTabKey } from "@/frontend/common/views/dashboard/permissions/components/useSingleGroupState";
import { useSingleGroupState } from "@/frontend/common/views/dashboard/permissions/components/useSingleGroupState";

interface SingleGroupViewProps {
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

export function SingleGroupView({
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
  const t = useTranslations("dashboard.permissions");
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
      <SingleGroupHeader group={group} onBack={onBack} onEditGroup={onEditGroup} />

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={activeSubTab}
          onChange={(_, val: SubTabKey) => handleSubTabChange(val)}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab
            value="current"
            label={`${t("currentPermissions")} (${permissionsCount})`}
            sx={{ textTransform: "none", fontWeight: 600 }}
          />
          {!group.isSystem && (
            <Tab value="add" label={t("addPermissions")} sx={{ textTransform: "none", fontWeight: 600 }} />
          )}
          <Tab
            value="users"
            label={`${t("assignedUsers")} (${assignedUsersCount})`}
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
              group={group}
              groupPermissions={groupPermissions}
              permissionsCount={permissionsCount}
              onRevokePermission={handleRevokePermission}
              onSwitchToAddTab={() => setActiveSubTab("add")}
              loading={isLoading}
            />
          )}

          {activeSubTab === "add" && !group.isSystem && (
            <AddPermissionsTab
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
