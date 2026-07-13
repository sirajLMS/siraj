"use client";

import { Box, CircularProgress } from "@mui/material";
import { useTranslations } from "next-intl";
import { SectionPanel } from "@/frontend/components/ui";
import type { Permission, PermissionGroup, User } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { PermissionCatalogSection } from "@/frontend/views/dashboard/permissions/components/PermissionCatalogSection";
import { PermissionGroupCardList } from "@/frontend/views/dashboard/permissions/components/PermissionGroupCardList";
import { PermissionGroupsDataGrid } from "@/frontend/views/dashboard/permissions/components/PermissionGroupsDataGrid";
import { UserOverridesDataGrid } from "@/frontend/views/dashboard/permissions/components/UserOverridesDataGrid";

export type TabKey = "groups" | "catalog" | "overrides";

export interface PermissionTabContentProps {
  readonly activeTab: TabKey;
  readonly isLoading: boolean;
  readonly isMobile: boolean;
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

export function PermissionTabContent({
  activeTab,
  isLoading,
  isMobile,
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
  const t = useTranslations("dashboard.permissions");

  if (isLoading && !groups) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box>
      {activeTab === "groups" &&
        (isMobile ? (
          <PermissionGroupCardList
            groups={groups}
            onViewGroup={setSelectedGroupId}
            onEditGroup={openEditDialog}
            onDeleteGroup={openDeleteDialog}
            onAssignGroup={openAssignDialog}
          />
        ) : (
          <SectionPanel title={t("groupsTab")}>
            <PermissionGroupsDataGrid
              groups={groups}
              onViewGroup={setSelectedGroupId}
              onEditGroup={openEditDialog}
              onDeleteGroup={openDeleteDialog}
              onAssignGroup={openAssignDialog}
              loading={isLoading}
            />
          </SectionPanel>
        ))}

      {activeTab === "catalog" && (
        <PermissionCatalogSection permissions={permissions} groups={groups} loading={isLoading} />
      )}

      {activeTab === "overrides" && (
        <SectionPanel title={t("overridesTab")}>
          <UserOverridesDataGrid
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
