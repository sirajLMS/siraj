"use client";

import { useViewport } from "@/frontend/common/hooks/useViewport";
import type { ScheduleAlert, ScheduleAlertType } from "@/frontend/common/views/dashboard/schedule/alerts/types";
import { ScheduleAlertBannersDesktop } from "@/frontend/desktop/views/dashboard/schedule/alerts/scheduleAlertBanners.desktop";
import { ScheduleAlertBannersMobile } from "@/frontend/mobile/views/dashboard/schedule/alerts/scheduleAlertBanners.mobile";

interface ScheduleAlertBannersProps {
  readonly alerts: readonly ScheduleAlert[];
  readonly labels: Record<ScheduleAlertType, string>;
}

export function ScheduleAlertBanners({ alerts, labels }: ScheduleAlertBannersProps) {
  const { isMobile } = useViewport();

  if (isMobile) {
    return <ScheduleAlertBannersMobile alerts={alerts} labels={labels} />;
  }

  return <ScheduleAlertBannersDesktop alerts={alerts} labels={labels} />;
}
