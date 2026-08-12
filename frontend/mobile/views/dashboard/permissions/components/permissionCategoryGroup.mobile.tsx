"use client";

import { PermissionCategoryGroupShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionCategoryGroupShared";
import type { PermissionCategoryGroupProps } from "@/frontend/common/views/dashboard/permissions/types";
import { PermissionRowMobile } from "@/frontend/mobile/views/dashboard/permissions/components/permissionRow.mobile";

export function PermissionCategoryGroupMobile(props: Readonly<PermissionCategoryGroupProps>) {
  return <PermissionCategoryGroupShared {...props} slots={{ PermissionRow: PermissionRowMobile }} />;
}
