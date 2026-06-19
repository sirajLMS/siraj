"use client";

import { Alert, Box, useMediaQuery, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { PageContainer, PageHeader, PrimaryPageAction } from "@/frontend/components/ui";
import type { Permission, PermissionGroup, User, UserOverride } from "@/frontend/graphql/generated/gql/graphql-types";
import { AdminQueueTabBar } from "@/frontend/views/dashboard/shared/AdminQueueTabBar";
import { PermissionManagementDialogs } from "./components/PermissionManagementDialogs";
import { PermissionTabContent, type TabKey } from "./components/PermissionTabContent";
import { SingleGroupView } from "./components/SingleGroupView";

export interface PermissionManagementViewProps {
  readonly permissions: readonly Permission[];
  readonly groups: readonly PermissionGroup[];
  readonly overrides: readonly UserOverride[];
  readonly users: readonly User[];
  readonly selectedGroupId: string | null;
  readonly selectedGroupIds: readonly string[];
  readonly selectedUserIds: readonly string[];
  readonly selectedPermissionIds: readonly string[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isCreateDialogOpen: boolean;
  readonly isEditDialogOpen: boolean;
  readonly isDeleteDialogOpen: boolean;
  readonly isAssignDialogOpen: boolean;
  readonly isBulkRemoveUsersOpen: boolean;
  readonly isManageOverridesOpen: boolean;

  readonly setSelectedGroupId: (id: string | null) => void;
  readonly setSelectedGroupIds: (ids: string[]) => void;
  readonly setSelectedUserIds: (ids: string[]) => void;
  readonly setSelectedPermissionIds: (ids: string[]) => void;

  readonly openCreateDialog: () => void;
  readonly closeCreateDialog: () => void;
  readonly openEditDialog: (id: string) => void;
  readonly closeEditDialog: () => void;
  readonly openDeleteDialog: (id: string) => void;
  readonly closeDeleteDialog: () => void;
  readonly openAssignDialog: (id: string) => void;
  readonly closeAssignDialog: () => void;
  readonly openBulkRemoveUsers: () => void;
  readonly closeBulkRemoveUsers: () => void;
  readonly openManageOverrides: () => void;
  readonly closeManageOverrides: () => void;

  readonly onCreateGroup: (name: string, description: string, permissionIds: string[]) => Promise<void>;
  readonly onUpdateGroup: (id: string, name: string, description: string, permissionIds: string[]) => Promise<void>;
  readonly onDeleteGroup: (id: string) => Promise<void>;
  readonly onAssignGroup: (groupId: string, userId: string) => Promise<void>;
  readonly onRevokeGroup: (groupId: string, userId: string) => Promise<void>;
  readonly onBulkAssign: (groupId: string, userIds: string[]) => Promise<void>;
  readonly onBulkRevoke: (groupId: string, userIds: string[]) => Promise<void>;
  readonly onUpdateOverrides: (
    userId: string,
    overrides: Array<{ permissionId: string; state: string }>
  ) => Promise<void>;
}

export function PermissionManagementView({
  permissions,
  groups,
  users,
  selectedGroupId,
  isLoading,
  error,
  isCreateDialogOpen,
  isEditDialogOpen,
  isDeleteDialogOpen,
  isAssignDialogOpen,
  isManageOverridesOpen,
  setSelectedGroupId,
  openCreateDialog,
  closeCreateDialog,
  openEditDialog,
  closeEditDialog,
  openDeleteDialog,
  closeDeleteDialog,
  openAssignDialog,
  closeAssignDialog,
  openManageOverrides,
  closeManageOverrides,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAssignGroup,
  onRevokeGroup,
  onBulkAssign,
  onBulkRevoke,
  onUpdateOverrides,
}: Readonly<PermissionManagementViewProps>) {
  const t = useTranslations("dashboard.permissions");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [activeTab, setActiveTab] = useState<TabKey>("groups");
  const [selectedUserIdForOverrides, setSelectedUserIdForOverrides] = useState<string | null>(null);

  const tabs = [
    { key: "groups" as const, label: t("groupsTab") },
    { key: "catalog" as const, label: t("catalogTab") },
    { key: "overrides" as const, label: t("overridesTab") },
  ];

  const headerActions =
    activeTab === "groups" ? (
      <PrimaryPageAction id="create-group-btn" onClick={openCreateDialog}>
        {t("addPermissions")}
      </PrimaryPageAction>
    ) : null;

  const activeGroup = groups.find(g => g.id === selectedGroupId) || null;

  return (
    <PageContainer>
      {activeGroup ? (
        <SingleGroupView
          group={activeGroup}
          permissions={permissions}
          isLoading={isLoading}
          onBack={() => setSelectedGroupId(null)}
          onEditGroup={openEditDialog}
          onAssignGroup={openAssignDialog}
          onRevokeGroup={onRevokeGroup}
          onBulkAssign={onBulkAssign}
          onBulkRevoke={onBulkRevoke}
          onUpdateGroup={onUpdateGroup}
        />
      ) : (
        <>
          <PageHeader title={t("title")} subtitle={t("subtitle")} actions={headerActions} />

          <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <AdminQueueTabBar activeTab={activeTab} tabs={tabs} onTabChange={(tab: TabKey) => setActiveTab(tab)} />

            <PermissionTabContent
              activeTab={activeTab}
              isLoading={isLoading}
              isMobile={isMobile}
              permissions={permissions}
              groups={groups}
              users={users}
              setSelectedGroupId={setSelectedGroupId}
              openEditDialog={openEditDialog}
              openDeleteDialog={openDeleteDialog}
              openAssignDialog={openAssignDialog}
              openManageOverrides={openManageOverrides}
              setSelectedUserIdForOverrides={setSelectedUserIdForOverrides}
            />
          </Box>
        </>
      )}

      <PermissionManagementDialogs
        permissions={permissions}
        groups={groups}
        users={users}
        isLoading={isLoading}
        activeGroup={activeGroup}
        selectedGroupId={selectedGroupId}
        selectedUserIdForOverrides={selectedUserIdForOverrides}
        isCreateDialogOpen={isCreateDialogOpen}
        isEditDialogOpen={isEditDialogOpen}
        isDeleteDialogOpen={isDeleteDialogOpen}
        isAssignDialogOpen={isAssignDialogOpen}
        isManageOverridesOpen={isManageOverridesOpen}
        closeCreateDialog={closeCreateDialog}
        closeEditDialog={closeEditDialog}
        closeDeleteDialog={closeDeleteDialog}
        closeAssignDialog={closeAssignDialog}
        closeManageOverrides={closeManageOverrides}
        setSelectedUserIdForOverrides={setSelectedUserIdForOverrides}
        onCreateGroup={onCreateGroup}
        onUpdateGroup={onUpdateGroup}
        onDeleteGroup={onDeleteGroup}
        onAssignGroup={onAssignGroup}
        onUpdateOverrides={onUpdateOverrides}
      />
    </PageContainer>
  );
}
