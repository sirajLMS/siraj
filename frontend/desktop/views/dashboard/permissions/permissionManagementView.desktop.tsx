"use client";

import { Alert, Box } from "@mui/material";
import type { PermissionManagementViewModel } from "@/frontend/common/views/dashboard/permissions/usePermissionManagementViewModel";
import { AdminQueueTabBar } from "@/frontend/common/views/dashboard/shared/AdminQueueTabBar";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { PermissionManagementDialogsDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/permissionManagementDialogs.desktop";
import { PermissionTabContentDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/permissionTabContent.desktop";
import { SingleGroupViewDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/singleGroupView.desktop";

function PermissionErrorAlert({
  error,
  t,
}: {
  readonly error: string | null;
  readonly t: import("@/shared/locale").PermissionsLabels;
}) {
  if (!error) return null;
  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      {error === "operationFailed" ? t.errors.operationFailed : error}
    </Alert>
  );
}

export function PermissionManagementDesktopView({
  labels,
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
  onDeleteGroup,
  onAssignGroup,
  activeGroup,
  activeTab,
  setActiveTab,
  setSelectedUserIdForOverrides,
  catalogFilter,
  createGroupForm,
  editGroupForm,
  assignGroupForm,
  singleGroupState,
  manageOverridesState,
  groupRowMenuAnchor,
}: Readonly<PermissionManagementViewModel>) {
  const t = labels;

  const tabs = [
    { key: "groups" as const, label: t.groupsTab },
    { key: "catalog" as const, label: t.catalogTab },
    { key: "overrides" as const, label: t.overridesTab },
  ];

  const headerActions =
    activeTab === "groups" ? (
      <DesktopPrimaryPageAction id="create-group-btn" onClick={openCreateDialog}>
        {t.addPermissions}
      </DesktopPrimaryPageAction>
    ) : null;

  return (
    <DesktopPageContainer>
      {activeGroup ? (
        <SingleGroupViewDesktop
          labels={labels}
          group={activeGroup}
          permissions={permissions}
          isLoading={isLoading}
          onBack={() => setSelectedGroupId(null)}
          onEditGroup={openEditDialog}
          onAssignGroup={openAssignDialog}
          singleGroupState={singleGroupState}
        />
      ) : (
        <>
          <DesktopPageHeader title={t.title} subtitle={t.subtitle} actions={headerActions} />

          <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 3 }}>
            <PermissionErrorAlert error={error} t={t} />

            <AdminQueueTabBar activeTab={activeTab} tabs={tabs} onTabChange={setActiveTab} />

            <PermissionTabContentDesktop
              labels={labels}
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
              catalogFilter={catalogFilter}
              groupRowMenuAnchor={groupRowMenuAnchor}
            />
          </Box>
        </>
      )}

      <PermissionManagementDialogsDesktop
        labels={labels}
        isLoading={isLoading}
        activeGroup={activeGroup}
        selectedGroupId={selectedGroupId}
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
        onDeleteGroup={onDeleteGroup}
        onAssignGroup={onAssignGroup}
        createGroupForm={createGroupForm}
        editGroupForm={editGroupForm}
        assignGroupForm={assignGroupForm}
        manageOverridesState={manageOverridesState}
      />
    </DesktopPageContainer>
  );
}
