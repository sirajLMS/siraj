"use client";

import { PermissionRowShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionRowShared";
import { DESKTOP_OPTIONS } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionRowShared.options";
import type { PermissionRowProps } from "@/frontend/common/views/dashboard/permissions/types";

export function PermissionRowDesktop(props: PermissionRowProps) {
  return <PermissionRowShared {...props} options={DESKTOP_OPTIONS} />;
}
