"use client";

import { MissedClassAlertBannerShared } from "@/frontend/common/views/dashboard/teachers/dashboard/components/__shared__/missedClassAlertBannerShared";
import type { MissedClassAlertBannerProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";
import { DismissAlertButtonMobile } from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/dismissAlertButton.mobile";

const MOBILE_SLOTS = {
  DismissButton: DismissAlertButtonMobile,
} as const;

/**
 * Mobile variant of the missed-class alert banner.
 * Uses `DismissAlertButtonMobile` as the dismiss action slot.
 */
export function MissedClassAlertBannerMobile({
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
      slots={MOBILE_SLOTS}
    />
  );
}
