"use client";

import { Box, CircularProgress } from "@mui/material";
import type { PermissionTabContentProps } from "@/frontend/common/views/dashboard/permissions/types";
import { PermissionCatalogSectionMobile } from "@/frontend/mobile/views/dashboard/permissions/components/permissionCatalogSection.mobile";
import { PermissionGroupCardListMobile } from "@/frontend/mobile/views/dashboard/permissions/components/permissionGroupCardList.mobile";
import { UserOverridesDataGridMobile } from "@/frontend/mobile/views/dashboard/permissions/components/userOverridesDataGrid.mobile";

export function PermissionTabContentMobile({
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
        <PermissionGroupCardListMobile
          labels={labels}
          groups={groups}
          onViewGroup={setSelectedGroupId}
          onEditGroup={openEditDialog}
          onDeleteGroup={openDeleteDialog}
          onAssignGroup={openAssignDialog}
          groupRowMenuAnchor={groupRowMenuAnchor}
        />
      )}

      {activeTab === "catalog" && (
        <PermissionCatalogSectionMobile
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
        <UserOverridesDataGridMobile
          labels={labels}
          users={users}
          groups={groups}
          loading={isLoading}
          onManageOverrides={userId => {
            setSelectedUserIdForOverrides(userId);
            openManageOverrides();
          }}
        />
      )}
    </Box>
  );
}
