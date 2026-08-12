"use client";

import { LocalizedStringFormField } from "@/frontend/common/components/ui/input/localizedString";
import { PermissionGroupFormShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionGroupFormShared";
import { DESKTOP_OPTIONS } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionGroupFormShared.options";
import type { PermissionGroupFormProps } from "@/frontend/common/views/dashboard/permissions/types";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { PermissionCategoryListDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/permissionCategoryList.desktop";
import { PermissionFilterBarDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/permissionFilterBar.desktop";

export function PermissionGroupFormDesktop(props: Readonly<PermissionGroupFormProps>) {
  return (
    <PermissionGroupFormShared
      {...props}
      options={DESKTOP_OPTIONS}
      slots={{
        SectionPanel: DesktopSectionPanel,
        LocalizedStringFormField,
        PermissionFilterBar: PermissionFilterBarDesktop,
        PermissionCategoryList: PermissionCategoryListDesktop,
      }}
    />
  );
}
