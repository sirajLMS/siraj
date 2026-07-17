"use client";

import { Box, CircularProgress } from "@mui/material";
import { SectionPanel } from "@/frontend/common/components/ui";
import type { Permission, PermissionGroup, User } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { PermissionCatalogSectionDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/permissionCatalogSection.desktop";
import { PermissionGroupsDataGridDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/permissionGroupsDataGrid.desktop";
import { UserOverridesDataGridDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/userOverridesDataGrid.desktop";
import { useAppTranslation } from "@/shared/locale";

export type TabKey = "groups" | "catalog" | "overrides";

export interface PermissionTabContentDesktopProps {
  readonly activeTab: TabKey;
  readonly isLoading: boolean;
  readonly permissions: readonly Permission[];
  readonly groups: readonly PermissionGroup[];
  readonly users: readonly User[];
  readonly setSelectedGroupId: (id: string | null) => void;
  readonly openEditDialog: (id: string) => void;
  readonly openDeleteDialog: (id: string) => void;
  readonly openAssignDialog: (id: string) => void;
  readonly openManageOverrides: () => void;
  readonly setSelectedUserIdForOverrides: (id: string | null) => void;
}

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
}: Readonly<PermissionTabContentDesktopProps>) {
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
        <SectionPanel title={t.groupsTab}>
          <PermissionGroupsDataGridDesktop
            groups={groups}
            onViewGroup={setSelectedGroupId}
            onEditGroup={openEditDialog}
            onDeleteGroup={openDeleteDialog}
            onAssignGroup={openAssignDialog}
            loading={isLoading}
          />
        </SectionPanel>
      )}

      {activeTab === "catalog" && (
        <PermissionCatalogSectionDesktop permissions={permissions} groups={groups} loading={isLoading} />
      )}

      {activeTab === "overrides" && (
        <SectionPanel title={t.overridesTab}>
          <UserOverridesDataGridDesktop
            users={users}
            groups={groups}
            loading={isLoading}
            onManageOverrides={userId => {
              setSelectedUserIdForOverrides(userId);
              openManageOverrides();
            }}
          />
        </SectionPanel>
      )}
    </Box>
  );
}
