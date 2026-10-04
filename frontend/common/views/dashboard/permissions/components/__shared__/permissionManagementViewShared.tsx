"use client";

import {
  buildDialogContext,
  renderDialogs,
} from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionManagementViewShared.dialogParts";
import {
  buildRenderContext,
  renderSingleGroupView,
  renderTabContent,
} from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionManagementViewShared.renderParts";
import type {
  PermissionManagementViewSharedInput,
  PermissionManagementViewSharedOptions,
} from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionManagementViewShared.types";

export type { PermissionManagementViewSharedOptions };

export function PermissionManagementViewShared(props: PermissionManagementViewSharedInput) {
  const { activeGroup, slots } = props;
  const { PageContainer } = slots;

  return (
    <PageContainer>
      {activeGroup ? renderSingleGroupView(buildRenderContext(props)) : renderTabContent(buildRenderContext(props))}
      {renderDialogs(buildDialogContext(props))}
    </PageContainer>
  );
}
