"use client";

import { Box, CircularProgress } from "@mui/material";
import type { PermissionTabContentProps } from "@/frontend/common/views/dashboard/permissions/types";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { PermissionCatalogSectionDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/permissionCatalogSection.desktop";
import { PermissionGroupsDataGridDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/permissionGroupsDataGrid.desktop";
import { UserOverridesDataGridDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/userOverridesDataGrid.desktop";
import { useAppTranslation } from "@/shared/locale";

export type TabKey = "groups" | "catalog" | "overrides";

export function PermissionTabContentDesktop({
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
  const t = useAppTranslation().dashboardTranslations.permissions;

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
            groups={groups}
            onViewGroup={setSelectedGroupId}
            onEditGroup={openEditDialog}
            onDeleteGroup={openDeleteDialog}
            onAssignGroup={openAssignDialog}
            loading={isLoading}
          />
        </DesktopSectionPanel>
      )}

      {activeTab === "catalog" && (
        <PermissionCatalogSectionDesktop permissions={permissions} groups={groups} loading={isLoading} />
      )}

      {activeTab === "overrides" && (
        <DesktopSectionPanel title={t.overridesTab}>
          <UserOverridesDataGridDesktop
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
