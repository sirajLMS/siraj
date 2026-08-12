"use client";

import { LocalizedStringDisplay } from "@/frontend/common/components/ui/display";
import { OverridesUserSidebarShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/overridesUserSidebarShared";
import { DESKTOP_OPTIONS } from "@/frontend/common/views/dashboard/permissions/components/__shared__/overridesUserSidebarShared.options";
import type { OverridesUserSidebarProps } from "@/frontend/common/views/dashboard/permissions/types";

export function OverridesUserSidebarDesktop(props: Readonly<OverridesUserSidebarProps>) {
  return <OverridesUserSidebarShared {...props} options={DESKTOP_OPTIONS} slots={{ LocalizedStringDisplay }} />;
}
