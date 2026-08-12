"use client";

import { OverridesUserSidebarShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/overridesUserSidebarShared";
import { MOBILE_OPTIONS } from "@/frontend/common/views/dashboard/permissions/components/__shared__/overridesUserSidebarShared.options";
import type { OverridesUserSidebarProps } from "@/frontend/common/views/dashboard/permissions/types";
import { MobileLocalizedStringDisplay } from "@/frontend/mobile/components/ui/display/localizedStringDisplay";

export function OverridesUserSidebarMobile(props: Readonly<OverridesUserSidebarProps>) {
  return (
    <OverridesUserSidebarShared
      {...props}
      options={MOBILE_OPTIONS}
      slots={{ LocalizedStringDisplay: MobileLocalizedStringDisplay }}
    />
  );
}
