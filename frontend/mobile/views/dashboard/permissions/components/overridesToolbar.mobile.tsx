"use client";

import { OverridesToolbarShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/overridesToolbarShared";
import { MOBILE_OPTIONS } from "@/frontend/common/views/dashboard/permissions/components/__shared__/overridesToolbarShared.options";
import type { OverridesToolbarProps } from "@/frontend/common/views/dashboard/permissions/types";

export function OverridesToolbarMobile(props: Readonly<OverridesToolbarProps>) {
  return <OverridesToolbarShared {...props} options={MOBILE_OPTIONS} />;
}
