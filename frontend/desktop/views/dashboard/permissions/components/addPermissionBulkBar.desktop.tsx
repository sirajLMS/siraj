"use client";

import { AddPermissionBulkBarShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/addPermissionBulkBarShared";
import type { AddPermissionBulkBarProps } from "@/frontend/common/views/dashboard/permissions/types";

export function AddPermissionBulkBarDesktop(props: Readonly<AddPermissionBulkBarProps>) {
  return <AddPermissionBulkBarShared {...props} variant="desktop" />;
}
