"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { PermissionErrorAlert } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionManagementViewShared.parts";
import type {
  PermissionManagementViewSharedInput,
  RenderContext,
} from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionManagementViewShared.types";
import { AdminQueueTabBar } from "@/frontend/common/views/dashboard/shared/AdminQueueTabBar";
import type { PermissionsLabels } from "@/shared/locale";

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

export function buildRenderContext(props: PermissionManagementViewSharedInput): RenderContext {
  return {
    labels: props.labels,
    permissions: props.permissions,
    isLoading: props.isLoading,
    error: props.error,
    activeTab: props.activeTab,
    activeGroup: props.activeGroup,
    groups: props.groups,
    users: props.users,
    setActiveTab: props.setActiveTab,
    setSelectedGroupId: props.setSelectedGroupId,
    openEditDialog: props.openEditDialog,
    openDeleteDialog: props.openDeleteDialog,
    openAssignDialog: props.openAssignDialog,
    openManageOverrides: props.openManageOverrides,
    setSelectedUserIdForOverrides: props.setSelectedUserIdForOverrides,
    catalogFilter: props.catalogFilter,
    groupRowMenuAnchor: props.groupRowMenuAnchor,
    singleGroupState: props.singleGroupState,
    openCreateDialog: props.openCreateDialog,
    options: props.options,
    slots: props.slots,
  };
}

function renderHeaderActions(ctx: RenderContext): ReactNode {
  if (ctx.activeTab !== "groups") return null;
  const { PrimaryPageAction } = ctx.slots;
  return (
    <PrimaryPageAction id="create-group-btn" onClick={ctx.openCreateDialog}>
      {ctx.labels.addPermissions}
    </PrimaryPageAction>
  );
}

export function renderSingleGroupView(ctx: RenderContext): ReactNode {
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

export function renderTabContent(ctx: RenderContext): ReactNode {
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
