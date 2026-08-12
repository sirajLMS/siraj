"use client";

import { PermissionFilterBarShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionFilterBarShared";
import { DESKTOP_OPTIONS } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionFilterBarShared.options";
import type { PermissionFilterBarProps } from "@/frontend/common/views/dashboard/permissions/types";

export function PermissionFilterBarDesktop(props: Readonly<PermissionFilterBarProps>) {
  return <PermissionFilterBarShared {...props} options={DESKTOP_OPTIONS} />;
}
