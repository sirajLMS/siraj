"use client";

import { DashboardSkeletonBase } from "@/frontend/common/views/dashboard/components/DashboardSkeletonBase";

/** Placeholder while mobile/desktop dashboard layout chunks load. */
export function DashboardLayoutLoading() {
  return <DashboardSkeletonBase navItemCount={6} contentVariant="compact" />;
}
