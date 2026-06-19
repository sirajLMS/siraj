"use client";

import { Alert, Box, CircularProgress, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { PageContainer, PageHeader, PrimaryPageAction, SectionPanel } from "@/frontend/components/ui";
import type { Permission, PermissionGroup, User, UserOverride } from "@/frontend/graphql/generated/gql/graphql-types";
import { AdminQueueTabBar } from "@/frontend/views/dashboard/shared/AdminQueueTabBar";
import { AssignGroupDialog } from "./components/AssignGroupDialog";
import { DeleteGroupDialog } from "./components/DeleteGroupDialog";
import { PermissionCatalogSection } from "./components/PermissionCatalogSection";
import { PermissionGroupCardList } from "./components/PermissionGroupCardList";
import { PermissionGroupForm } from "./components/PermissionGroupForm";
import { PermissionGroupsDataGrid } from "./components/PermissionGroupsDataGrid";

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

type TabKey = "groups" | "catalog" | "overrides";

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
  openCreateDialog,
  closeCreateDialog,
  openEditDialog,
  closeEditDialog,
  openDeleteDialog,
  closeDeleteDialog,
  openAssignDialog,
  closeAssignDialog,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAssignGroup,
}: Readonly<PermissionManagementViewProps>) {
  const t = useTranslations("dashboard.permissions");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [activeTab, setActiveTab] = useState<TabKey>("groups");

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
      <PageHeader title={t("title")} subtitle={t("subtitle")} actions={headerActions} />

      <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <AdminQueueTabBar activeTab={activeTab} tabs={tabs} onTabChange={(tab: TabKey) => setActiveTab(tab)} />

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : (
          <Box>
            {activeTab === "groups" &&
              (isMobile ? (
                <PermissionGroupCardList
                  groups={groups}
                  onEditGroup={openEditDialog}
                  onDeleteGroup={openDeleteDialog}
                  onAssignGroup={openAssignDialog}
                />
              ) : (
                <SectionPanel title={t("groupsTab")}>
                  <PermissionGroupsDataGrid
                    groups={groups}
                    onEditGroup={openEditDialog}
                    onDeleteGroup={openDeleteDialog}
                    onAssignGroup={openAssignDialog}
                  />
                </SectionPanel>
              ))}

            {activeTab === "catalog" && <PermissionCatalogSection permissions={permissions} groups={groups} />}

            {activeTab === "overrides" && (
              <SectionPanel title={t("overridesTab")}>
                <Box sx={{ p: 4, textAlign: "center" }}>
                  <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
                    User Overrides DataGrid Placeholder
                  </Typography>
                </Box>
              </SectionPanel>
            )}
          </Box>
        )}
      </Box>

      {/* Group Create Dialog */}
      <PermissionGroupForm
        open={isCreateDialogOpen}
        group={null}
        permissions={permissions}
        isLoading={isLoading}
        onClose={closeCreateDialog}
        onSave={onCreateGroup}
      />

      {/* Group Edit Dialog */}
      <PermissionGroupForm
        open={isEditDialogOpen}
        group={activeGroup}
        permissions={permissions}
        isLoading={isLoading}
        onClose={closeEditDialog}
        onSave={async (name, description, permissionIds) => {
          if (selectedGroupId) {
            await onUpdateGroup(selectedGroupId, name, description, permissionIds);
          }
        }}
      />

      {/* Group Delete Dialog */}
      <DeleteGroupDialog
        open={isDeleteDialogOpen}
        groupName={activeGroup?.name || ""}
        isLoading={isLoading}
        onClose={closeDeleteDialog}
        onConfirm={async () => {
          if (selectedGroupId) {
            await onDeleteGroup(selectedGroupId);
          }
        }}
      />

      {/* Group Assign Dialog */}
      <AssignGroupDialog
        open={isAssignDialogOpen}
        group={activeGroup}
        users={users}
        isLoading={isLoading}
        onClose={closeAssignDialog}
        onAssign={async userId => {
          if (selectedGroupId) {
            await onAssignGroup(selectedGroupId, userId);
          }
        }}
      />
    </PageContainer>
  );
}
