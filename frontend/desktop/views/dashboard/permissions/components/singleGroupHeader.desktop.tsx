"use client";

import { SingleGroupHeaderShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/singleGroupHeaderShared";
import { DESKTOP_OPTIONS } from "@/frontend/common/views/dashboard/permissions/components/__shared__/singleGroupHeaderShared.options";
import type { SingleGroupHeaderProps } from "@/frontend/common/views/dashboard/permissions/types";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";

export function SingleGroupHeaderDesktop(props: Readonly<SingleGroupHeaderProps>) {
  return <SingleGroupHeaderShared {...props} options={DESKTOP_OPTIONS} slots={{ StatusBadge: DesktopStatusBadge }} />;
}
