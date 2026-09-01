"use client";

import { Alert, Box } from "@mui/material";
import type { ComponentType, ReactNode } from "react";
import type {
  PermissionManagementDialogsProps,
  PermissionTabContentProps,
  SingleGroupViewProps,
} from "@/frontend/common/views/dashboard/permissions/types";
import type { PermissionManagementViewModel } from "@/frontend/common/views/dashboard/permissions/usePermissionManagementViewModel";
import { AdminQueueTabBar } from "@/frontend/common/views/dashboard/shared/AdminQueueTabBar";
import type { PermissionsLabels } from "@/shared/locale";

export interface PermissionManagementViewSharedOptions {
  readonly contentSx: { readonly mt: number; readonly gap: number };
}

interface PageHeaderSlotProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly actions?: ReactNode;
}

interface PrimaryPageActionSlotProps {
  readonly id?: string;
  readonly onClick?: () => void;
  readonly children?: ReactNode;
}

export interface PermissionManagementViewSharedSlots {
  readonly PageContainer: ComponentType<{ readonly children: ReactNode }>;
  readonly PageHeader: ComponentType<PageHeaderSlotProps>;
  readonly PrimaryPageAction: ComponentType<PrimaryPageActionSlotProps>;
  readonly SingleGroupView: ComponentType<Readonly<SingleGroupViewProps>>;
  readonly PermissionTabContent: ComponentType<Readonly<PermissionTabContentProps>>;
  readonly PermissionManagementDialogs: ComponentType<Readonly<PermissionManagementDialogsProps>>;
}

function PermissionErrorAlert({ error, t }: { readonly error: string | null; readonly t: PermissionsLabels }) {
  if (!error) return null;
  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      {error === "operationFailed" ? t.errors.operationFailed : error}
    </Alert>
  );
}

interface TabEntry {
  readonly key: "groups" | "catalog" | "overrides";
  readonly label: string;
}

function buildTabs(t: PermissionsLabels): readonly TabEntry[] {
  return [
    { key: "groups", label: t.groupsTab },
    { key: "catalog", label: t.catalogTab },
    { key: "overrides", label: t.overridesTab },
  ];
}

type RenderContext = Pick<
  PermissionManagementViewModel,
  | "labels"
  | "permissions"
  | "isLoading"
  | "error"
  | "activeTab"
  | "activeGroup"
  | "groups"
  | "users"
  | "setActiveTab"
  | "setSelectedGroupId"
  | "openEditDialog"
  | "openDeleteDialog"
  | "openAssignDialog"
  | "openManageOverrides"
  | "setSelectedUserIdForOverrides"
  | "catalogFilter"
  | "groupRowMenuAnchor"
  | "singleGroupState"
  | "openCreateDialog"
> & {
  readonly options: PermissionManagementViewSharedOptions;
  readonly slots: PermissionManagementViewSharedSlots;
};

function renderHeaderActions(ctx: RenderContext): ReactNode {
  if (ctx.activeTab !== "groups") return null;
  const { PrimaryPageAction } = ctx.slots;
  return (
    <PrimaryPageAction id="create-group-btn" onClick={ctx.openCreateDialog}>
      {ctx.labels.addPermissions}
    </PrimaryPageAction>
  );
}

function renderSingleGroupView(ctx: RenderContext): ReactNode {
  if (!ctx.activeGroup) return null;
  const { SingleGroupView } = ctx.slots;
  const group = ctx.activeGroup;
  return (
    <SingleGroupView
      labels={ctx.labels}
      group={group}
      permissions={ctx.permissions}
      isLoading={ctx.isLoading}
      onBack={() => ctx.setSelectedGroupId(null)}
      onEditGroup={ctx.openEditDialog}
      onAssignGroup={ctx.openAssignDialog}
      singleGroupState={ctx.singleGroupState}
    />
  );
}

function renderTabContent(ctx: RenderContext): ReactNode {
  const { PageHeader, PermissionTabContent } = ctx.slots;
  return (
    <>
      <PageHeader title={ctx.labels.title} subtitle={ctx.labels.subtitle} actions={renderHeaderActions(ctx)} />
      <Box
        sx={{ mt: ctx.options.contentSx.mt, display: "flex", flexDirection: "column", gap: ctx.options.contentSx.gap }}
      >
        <PermissionErrorAlert error={ctx.error} t={ctx.labels} />
        <AdminQueueTabBar activeTab={ctx.activeTab} tabs={buildTabs(ctx.labels)} onTabChange={ctx.setActiveTab} />
        <PermissionTabContent
          labels={ctx.labels}
          activeTab={ctx.activeTab}
          isLoading={ctx.isLoading}
          permissions={ctx.permissions}
          groups={ctx.groups}
          users={ctx.users}
          setSelectedGroupId={ctx.setSelectedGroupId}
          openEditDialog={ctx.openEditDialog}
          openDeleteDialog={ctx.openDeleteDialog}
          openAssignDialog={ctx.openAssignDialog}
          openManageOverrides={ctx.openManageOverrides}
          setSelectedUserIdForOverrides={ctx.setSelectedUserIdForOverrides}
          catalogFilter={ctx.catalogFilter}
          groupRowMenuAnchor={ctx.groupRowMenuAnchor}
        />
      </Box>
    </>
  );
}

type DialogContext = Pick<
  PermissionManagementViewModel,
  | "labels"
  | "isLoading"
  | "activeGroup"
  | "selectedGroupId"
  | "isCreateDialogOpen"
  | "isEditDialogOpen"
  | "isDeleteDialogOpen"
  | "isAssignDialogOpen"
  | "isManageOverridesOpen"
  | "closeCreateDialog"
  | "closeEditDialog"
  | "closeDeleteDialog"
  | "closeAssignDialog"
  | "closeManageOverrides"
  | "setSelectedUserIdForOverrides"
  | "onDeleteGroup"
  | "onAssignGroup"
  | "createGroupForm"
  | "editGroupForm"
  | "assignGroupForm"
  | "manageOverridesState"
> & {
  readonly slots: PermissionManagementViewSharedSlots;
};

function renderDialogs(ctx: DialogContext): ReactNode {
  const { PermissionManagementDialogs } = ctx.slots;
  return (
    <PermissionManagementDialogs
      labels={ctx.labels}
      isLoading={ctx.isLoading}
      activeGroup={ctx.activeGroup}
      selectedGroupId={ctx.selectedGroupId}
      isCreateDialogOpen={ctx.isCreateDialogOpen}
      isEditDialogOpen={ctx.isEditDialogOpen}
      isDeleteDialogOpen={ctx.isDeleteDialogOpen}
      isAssignDialogOpen={ctx.isAssignDialogOpen}
      isManageOverridesOpen={ctx.isManageOverridesOpen}
      closeCreateDialog={ctx.closeCreateDialog}
      closeEditDialog={ctx.closeEditDialog}
      closeDeleteDialog={ctx.closeDeleteDialog}
      closeAssignDialog={ctx.closeAssignDialog}
      closeManageOverrides={ctx.closeManageOverrides}
      setSelectedUserIdForOverrides={ctx.setSelectedUserIdForOverrides}
      onDeleteGroup={ctx.onDeleteGroup}
      onAssignGroup={ctx.onAssignGroup}
      createGroupForm={ctx.createGroupForm}
      editGroupForm={ctx.editGroupForm}
      assignGroupForm={ctx.assignGroupForm}
      manageOverridesState={ctx.manageOverridesState}
    />
  );
}

export function PermissionManagementViewShared({
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
  options,
  slots,
}: Readonly<PermissionManagementViewModel> & {
  options: PermissionManagementViewSharedOptions;
  slots: PermissionManagementViewSharedSlots;
}) {
  const { PageContainer } = slots;

  const renderCtx: RenderContext = {
    labels,
    permissions,
    isLoading,
    error,
    activeTab,
    activeGroup,
    groups,
    users,
    setActiveTab,
    setSelectedGroupId,
    openEditDialog,
    openDeleteDialog,
    openAssignDialog,
    openManageOverrides,
    setSelectedUserIdForOverrides,
    catalogFilter,
    groupRowMenuAnchor,
    singleGroupState,
    openCreateDialog,
    options,
    slots,
  };

  const dialogCtx: DialogContext = {
    labels,
    isLoading,
    activeGroup,
    selectedGroupId,
    isCreateDialogOpen,
    isEditDialogOpen,
    isDeleteDialogOpen,
    isAssignDialogOpen,
    isManageOverridesOpen,
    closeCreateDialog,
    closeEditDialog,
    closeDeleteDialog,
    closeAssignDialog,
    closeManageOverrides,
    setSelectedUserIdForOverrides,
    onDeleteGroup,
    onAssignGroup,
    createGroupForm,
    editGroupForm,
    assignGroupForm,
    manageOverridesState,
    slots,
  };

  return (
    <PageContainer>
      {activeGroup ? renderSingleGroupView(renderCtx) : renderTabContent(renderCtx)}
      {renderDialogs(dialogCtx)}
    </PageContainer>
  );
}
