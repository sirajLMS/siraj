"use client";

import { PermissionCategoryListShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionCategoryListShared";
import type { PermissionCategoryListProps } from "@/frontend/common/views/dashboard/permissions/types";
import { PermissionCategoryGroupDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/permissionCategoryGroup.desktop";

export function PermissionCategoryListDesktop(props: Readonly<PermissionCategoryListProps>) {
  return (
    <PermissionCategoryListShared {...props} slots={{ PermissionCategoryGroup: PermissionCategoryGroupDesktop }} />
  );
}
