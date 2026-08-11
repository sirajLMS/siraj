"use client";

import { OverrideEditControlsShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/overrideEditControlsShared";
import type { OverrideEditControlsProps } from "@/frontend/common/views/dashboard/permissions/types";

export function OverrideEditControlsDesktop(props: Readonly<OverrideEditControlsProps>) {
  return <OverrideEditControlsShared {...props} />;
}
