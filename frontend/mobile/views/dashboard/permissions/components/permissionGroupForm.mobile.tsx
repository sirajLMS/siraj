"use client";

import { PermissionGroupFormShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionGroupFormShared";
import { MOBILE_OPTIONS } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionGroupFormShared.options";
import type { PermissionGroupFormProps } from "@/frontend/common/views/dashboard/permissions/types";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui/container";
import { LocalizedStringFormFieldMobile } from "@/frontend/mobile/components/ui/input/localizedString";
import { PermissionCategoryListMobile } from "@/frontend/mobile/views/dashboard/permissions/components/permissionCategoryList.mobile";
import { PermissionFilterBarMobile } from "@/frontend/mobile/views/dashboard/permissions/components/permissionFilterBar.mobile";

export function PermissionGroupFormMobile(props: Readonly<PermissionGroupFormProps>) {
  return (
    <PermissionGroupFormShared
      {...props}
      options={MOBILE_OPTIONS}
      slots={{
        SectionPanel: MobileSectionPanel,
        LocalizedStringFormField: LocalizedStringFormFieldMobile,
        PermissionFilterBar: PermissionFilterBarMobile,
        PermissionCategoryList: PermissionCategoryListMobile,
      }}
    />
  );
}
