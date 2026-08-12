"use client";

import { PermissionManagementViewShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionManagementViewShared";
import { MOBILE_OPTIONS } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionManagementViewShared.options";
import type { PermissionManagementViewModel } from "@/frontend/common/views/dashboard/permissions/usePermissionManagementViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button";
import { PermissionManagementDialogsMobile } from "@/frontend/mobile/views/dashboard/permissions/components/permissionManagementDialogs.mobile";
import { PermissionTabContentMobile } from "@/frontend/mobile/views/dashboard/permissions/components/permissionTabContent.mobile";
import { SingleGroupViewMobile } from "@/frontend/mobile/views/dashboard/permissions/components/singleGroupView.mobile";

export function PermissionManagementMobileView(props: Readonly<PermissionManagementViewModel>) {
  return (
    <PermissionManagementViewShared
      {...props}
      options={MOBILE_OPTIONS}
      slots={{
        PageContainer: MobilePageContainer,
        PageHeader: MobilePageHeader,
        PrimaryPageAction: MobilePrimaryPageAction,
        SingleGroupView: SingleGroupViewMobile,
        PermissionTabContent: PermissionTabContentMobile,
        PermissionManagementDialogs: PermissionManagementDialogsMobile,
      }}
    />
  );
}
