"use client";

import { MissedClassAlertBannerShared } from "@/frontend/common/views/dashboard/teachers/dashboard/components/__shared__/missedClassAlertBannerShared";
import type { MissedClassAlertBannerProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";

/**
 * Desktop variant of the missed-class alert banner.
 */
export function MissedClassAlertBannerDesktop({
  alert,
  labels,
  fixed = false,
  onDismiss,
}: Readonly<MissedClassAlertBannerProps & { onDismiss?: () => void }>) {
  return <MissedClassAlertBannerShared alert={alert} labels={labels} fixed={fixed} onDismiss={onDismiss} />;
}
