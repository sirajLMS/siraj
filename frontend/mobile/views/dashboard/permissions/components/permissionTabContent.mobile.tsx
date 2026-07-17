"use client";

import { Box, CircularProgress } from "@mui/material";
import type { Permission, PermissionGroup, User } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { PermissionCatalogSectionMobile } from "@/frontend/mobile/views/dashboard/permissions/components/permissionCatalogSection.mobile";
import { PermissionGroupCardListMobile } from "@/frontend/mobile/views/dashboard/permissions/components/permissionGroupCardList.mobile";
import { UserOverridesDataGridMobile } from "@/frontend/mobile/views/dashboard/permissions/components/userOverridesDataGrid.mobile";

export type TabKey = "groups" | "catalog" | "overrides";

export interface PermissionTabContentMobileProps {
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
}: Readonly<PermissionTabContentMobileProps>) {
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
