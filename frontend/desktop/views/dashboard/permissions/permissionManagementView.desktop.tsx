"use client";

import { PermissionManagementViewShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionManagementViewShared";
import { DESKTOP_OPTIONS } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionManagementViewShared.options";
import type { PermissionManagementViewModel } from "@/frontend/common/views/dashboard/permissions/usePermissionManagementViewModel";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { PermissionManagementDialogsDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/permissionManagementDialogs.desktop";
import { PermissionTabContentDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/permissionTabContent.desktop";
import { SingleGroupViewDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/singleGroupView.desktop";

export function PermissionManagementDesktopView(props: Readonly<PermissionManagementViewModel>) {
  return (
    <PermissionManagementViewShared
      {...props}
      options={DESKTOP_OPTIONS}
      slots={{
        PageContainer: DesktopPageContainer,
        PageHeader: DesktopPageHeader,
        PrimaryPageAction: DesktopPrimaryPageAction,
        SingleGroupView: SingleGroupViewDesktop,
        PermissionTabContent: PermissionTabContentDesktop,
        PermissionManagementDialogs: PermissionManagementDialogsDesktop,
      }}
    />
  );
}
