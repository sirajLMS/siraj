"use client";

import { Alert, Box } from "@mui/material";
import { PageContainer, PageHeader, PrimaryPageAction } from "@/frontend/common/components/ui";
import { PermissionManagementDialogs } from "@/frontend/common/views/dashboard/permissions/components/PermissionManagementDialogs";
import { PermissionTabContent } from "@/frontend/common/views/dashboard/permissions/components/PermissionTabContent";
import { SingleGroupView } from "@/frontend/common/views/dashboard/permissions/components/SingleGroupView";
import type { PermissionManagementViewModel } from "@/frontend/common/views/dashboard/permissions/usePermissionManagementViewModel";
import { AdminQueueTabBar } from "@/frontend/common/views/dashboard/shared/AdminQueueTabBar";
import { useAppTranslation } from "@/shared/locale/client";

function PermissionErrorAlert({
  error,
  t,
}: {
  readonly error: string | null;
  readonly t: import("@/shared/locale/types/dashboard/permissions").PermissionsLabels;
}) {
  if (!error) return null;
  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      {error === "operationFailed" ? t.errors.operationFailed : error}
    </Alert>
  );
}

export function PermissionManagementDesktopView({
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
  closeEditDialog,
  closeDeleteDialog,
  closeAssignDialog,
  openEditDialog,
  openDeleteDialog,
  openAssignDialog,
  closeManageOverrides,
  openManageOverrides,
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
  const t = useAppTranslation("dashboard.permissions");

  const tabs = [
    { key: "groups" as const, label: t.groupsTab },
    { key: "catalog" as const, label: t.catalogTab },
    { key: "overrides" as const, label: t.overridesTab },
  ];

  const headerActions =
    activeTab === "groups" ? (
      <PrimaryPageAction id="create-group-btn" onClick={openCreateDialog}>
        {t.addPermissions}
      </PrimaryPageAction>
    ) : null;

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
          <PageHeader title={t.title} subtitle={t.subtitle} actions={headerActions} />

          <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 3 }}>
            <PermissionErrorAlert error={error} t={t} />

            <AdminQueueTabBar activeTab={activeTab} tabs={tabs} onTabChange={setActiveTab} />

            <PermissionTabContent
              activeTab={activeTab}
              isLoading={isLoading}
              isMobile={false}
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
