"use client";

import { PermissionRowShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionRowShared";
import { MOBILE_OPTIONS } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionRowShared.options";
import type { PermissionRowProps } from "@/frontend/common/views/dashboard/permissions/types";

export function PermissionRowMobile(props: PermissionRowProps) {
  return <PermissionRowShared {...props} options={MOBILE_OPTIONS} />;
}
