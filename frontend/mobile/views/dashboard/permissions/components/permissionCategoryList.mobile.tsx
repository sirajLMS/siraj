"use client";

import { PermissionCategoryListShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionCategoryListShared";
import type { PermissionCategoryListProps } from "@/frontend/common/views/dashboard/permissions/types";
import { PermissionCategoryGroupMobile } from "@/frontend/mobile/views/dashboard/permissions/components/permissionCategoryGroup.mobile";

export function PermissionCategoryListMobile(props: Readonly<PermissionCategoryListProps>) {
  return <PermissionCategoryListShared {...props} slots={{ PermissionCategoryGroup: PermissionCategoryGroupMobile }} />;
}
