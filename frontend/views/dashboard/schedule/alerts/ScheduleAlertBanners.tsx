"use client";

import { useViewport } from "@/frontend/common/hooks/useViewport";
import { ScheduleAlertBannersDesktop } from "@/frontend/views/dashboard/schedule/alerts/scheduleAlertBanners.desktop";
import { ScheduleAlertBannersMobile } from "@/frontend/views/dashboard/schedule/alerts/scheduleAlertBanners.mobile";
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
