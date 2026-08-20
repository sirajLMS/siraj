"use client";

import { DashboardSkeletonBase } from "@/frontend/common/views/dashboard/components/DashboardSkeletonBase";

/**
 * Fixed-height placeholder for the dashboard chrome while
 * `DashboardProfileShell` streams the user profile on first paint.
 */
export function DashboardShellSkeleton() {
  return <DashboardSkeletonBase navItemCount={8} contentVariant="detailed" />;
}
