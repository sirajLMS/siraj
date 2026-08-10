"use client";

import { ScheduleAlertsView } from "@/frontend/common/views/dashboard/schedule/alerts/ScheduleAlertsView";
import type { UseScheduleAlertsViewModelProps } from "@/frontend/common/views/dashboard/schedule/alerts/useScheduleAlertsViewModel";

export function ScheduleAlertsContainer(props: Readonly<UseScheduleAlertsViewModelProps>) {
  return <ScheduleAlertsView {...props} />;
}

export type { UseScheduleAlertsViewModelProps };
