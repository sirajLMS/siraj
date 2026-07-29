"use client";

import { Box, CircularProgress } from "@mui/material";
import type { PermissionTabContentProps } from "@/frontend/common/views/dashboard/permissions/types";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { PermissionCatalogSectionDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/permissionCatalogSection.desktop";
import { PermissionGroupsDataGridDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/permissionGroupsDataGrid.desktop";
import { UserOverridesDataGridDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/userOverridesDataGrid.desktop";

export type TabKey = "groups" | "catalog" | "overrides";

export function PermissionTabContentDesktop({
  labels,
  activeTab,
  isLoading,
  permissions,
  groups,
  users,
  setSelectedGroupId,
  openEditDialog,
  openDeleteDialog,
  openAssignDialog,
  openManageOverrides,
  setSelectedUserIdForOverrides,
  catalogFilter,
  groupRowMenuAnchor,
}: Readonly<PermissionTabContentProps>) {
  const t = labels;

  if (isLoading && !groups) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box>
      {activeTab === "groups" && (
        <DesktopSectionPanel title={t.groupsTab}>
          <PermissionGroupsDataGridDesktop
            labels={labels}
            groups={groups}
            onViewGroup={setSelectedGroupId}
            onEditGroup={openEditDialog}
            onDeleteGroup={openDeleteDialog}
            onAssignGroup={openAssignDialog}
            groupRowMenuAnchor={groupRowMenuAnchor}
            loading={isLoading}
          />
        </DesktopSectionPanel>
      )}

      {activeTab === "catalog" && (
        <PermissionCatalogSectionDesktop
          labels={labels}
          permissions={permissions}
          groups={groups}
          searchQuery={catalogFilter.searchQuery}
          setSearchQuery={catalogFilter.setSearchQuery}
          selectedCategory={catalogFilter.selectedCategory}
          setSelectedCategory={catalogFilter.setSelectedCategory}
          categories={catalogFilter.categories}
          filteredPermissions={catalogFilter.filteredPermissions}
          loading={isLoading}
        />
      )}

      {activeTab === "overrides" && (
        <DesktopSectionPanel title={t.overridesTab}>
          <UserOverridesDataGridDesktop
            labels={labels}
            users={users}
            groups={groups}
            loading={isLoading}
            onManageOverrides={userId => {
              setSelectedUserIdForOverrides(userId);
              openManageOverrides();
            }}
          />
        </DesktopSectionPanel>
      )}
    </Box>
  );
}
