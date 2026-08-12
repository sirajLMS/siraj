"use client";

import { ParentClassStatusIndicatorShared } from "@/frontend/common/views/dashboard/parent/dashboard/components/__shared__/parentClassStatusIndicatorShared";
import type { ParentClassStatusIndicatorProps } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardComponents.types";

export function ParentClassStatusIndicatorDesktop(props: Readonly<ParentClassStatusIndicatorProps>) {
  return <ParentClassStatusIndicatorShared {...props} />;
}
