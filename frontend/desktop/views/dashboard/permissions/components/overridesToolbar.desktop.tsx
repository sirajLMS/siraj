"use client";

import { OverridesToolbarShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/overridesToolbarShared";
import { DESKTOP_OPTIONS } from "@/frontend/common/views/dashboard/permissions/components/__shared__/overridesToolbarShared.options";
import type { OverridesToolbarProps } from "@/frontend/common/views/dashboard/permissions/types";

export function OverridesToolbarDesktop(props: Readonly<OverridesToolbarProps>) {
  return <OverridesToolbarShared {...props} options={DESKTOP_OPTIONS} />;
}
