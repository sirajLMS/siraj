"use client";

import { Box, CircularProgress } from "@mui/material";
import type { PermissionTabContentProps } from "@/frontend/common/views/dashboard/permissions/types";
import { PermissionCatalogSectionMobile } from "@/frontend/mobile/views/dashboard/permissions/components/permissionCatalogSection.mobile";
import { PermissionGroupCardListMobile } from "@/frontend/mobile/views/dashboard/permissions/components/permissionGroupCardList.mobile";
import { UserOverridesDataGridMobile } from "@/frontend/mobile/views/dashboard/permissions/components/userOverridesDataGrid.mobile";

export type TabKey = "groups" | "catalog" | "overrides";

export function PermissionTabContentMobile({
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
          groups={groups}
          onViewGroup={setSelectedGroupId}
          onEditGroup={openEditDialog}
          onDeleteGroup={openDeleteDialog}
          onAssignGroup={openAssignDialog}
        />
      )}

      {activeTab === "catalog" && (
        <PermissionCatalogSectionMobile permissions={permissions} groups={groups} loading={isLoading} />
      )}

      {activeTab === "overrides" && (
        <UserOverridesDataGridMobile
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
