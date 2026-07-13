"use client";

import { useViewport } from "@/frontend/common/hooks/useViewport";
import { ScheduleAlertBannersMobile } from "@/frontend/mobile/views/dashboard/schedule/alerts/scheduleAlertBanners.mobile";
import { ScheduleAlertBannersDesktop } from "@/frontend/views/dashboard/schedule/alerts/scheduleAlertBanners.desktop";
import type { ScheduleAlert, ScheduleAlertType } from "@/frontend/views/dashboard/schedule/alerts/types";

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
