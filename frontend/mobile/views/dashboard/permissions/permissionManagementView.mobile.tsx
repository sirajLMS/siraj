"use client";

import { Alert, Box } from "@mui/material";
import type { PermissionManagementViewModel } from "@/frontend/common/views/dashboard/permissions/usePermissionManagementViewModel";
import { AdminQueueTabBar } from "@/frontend/common/views/dashboard/shared/AdminQueueTabBar";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button";
import { PermissionManagementDialogsMobile } from "@/frontend/mobile/views/dashboard/permissions/components/permissionManagementDialogs.mobile";
import { PermissionTabContentMobile } from "@/frontend/mobile/views/dashboard/permissions/components/permissionTabContent.mobile";
import { SingleGroupViewMobile } from "@/frontend/mobile/views/dashboard/permissions/components/singleGroupView.mobile";
import { type PermissionsLabels, useAppTranslation } from "@/shared/locale";

function PermissionErrorAlert({ error, t }: { readonly error: string | null; readonly t: PermissionsLabels }) {
  if (!error) return null;
  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      {error === "operationFailed" ? t.errors.operationFailed : error}
    </Alert>
  );
}

export function PermissionManagementMobileView({
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
  activeGroup,
  activeTab,
  selectedUserIdForOverrides,
  setActiveTab,
  setSelectedUserIdForOverrides,
}: Readonly<PermissionManagementViewModel>) {
  const t = useAppTranslation().dashboardTranslations.permissions;

  const tabs = [
    { key: "groups" as const, label: t.groupsTab },
    { key: "catalog" as const, label: t.catalogTab },
    { key: "overrides" as const, label: t.overridesTab },
  ];

  const headerActions =
    activeTab === "groups" ? (
      <MobilePrimaryPageAction id="create-group-btn" onClick={openCreateDialog}>
        {t.addPermissions}
      </MobilePrimaryPageAction>
    ) : null;

  return (
    <MobilePageContainer>
      {activeGroup ? (
        <SingleGroupViewMobile
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
          <MobilePageHeader title={t.title} subtitle={t.subtitle} actions={headerActions} />

          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <PermissionErrorAlert error={error} t={t} />

            <AdminQueueTabBar activeTab={activeTab} tabs={tabs} onTabChange={setActiveTab} />

            <PermissionTabContentMobile
              activeTab={activeTab}
              isLoading={isLoading}
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

      <PermissionManagementDialogsMobile
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
    </MobilePageContainer>
  );
}
