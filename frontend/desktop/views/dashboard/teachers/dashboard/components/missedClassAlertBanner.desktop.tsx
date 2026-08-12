"use client";

import { MissedClassAlertBannerShared } from "@/frontend/common/views/dashboard/teachers/dashboard/components/__shared__/missedClassAlertBannerShared";
import type { MissedClassAlertBannerProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";
import { DismissAlertButtonDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/dismissAlertButton.desktop";

const DESKTOP_SLOTS = {
  DismissButton: DismissAlertButtonDesktop,
} as const;

/**
 * Desktop variant of the missed-class alert banner.
 * Uses `DismissAlertButtonDesktop` as the dismiss action slot.
 */
export function MissedClassAlertBannerDesktop({
  alert,
  labels,
  fixed = false,
  onDismiss,
}: Readonly<MissedClassAlertBannerProps & { onDismiss?: () => void }>) {
  return (
    <MissedClassAlertBannerShared
      alert={alert}
      labels={labels}
      fixed={fixed}
      onDismiss={onDismiss}
      slots={DESKTOP_SLOTS}
    />
  );
}
