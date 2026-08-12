"use client";

import { PermissionCategoryGroupShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionCategoryGroupShared";
import type { PermissionCategoryGroupProps } from "@/frontend/common/views/dashboard/permissions/types";
import { PermissionRowDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/permissionRow.desktop";

export function PermissionCategoryGroupDesktop(props: Readonly<PermissionCategoryGroupProps>) {
  return <PermissionCategoryGroupShared {...props} slots={{ PermissionRow: PermissionRowDesktop }} />;
}
