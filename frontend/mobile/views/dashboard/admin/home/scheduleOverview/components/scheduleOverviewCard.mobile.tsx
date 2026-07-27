"use client";

import {
  ScheduleOverviewCard as CommonScheduleOverviewCard,
  type ScheduleOverviewCardProps,
} from "@/frontend/common/views/dashboard/admin/home/components/ScheduleOverviewCardList";

export function ScheduleOverviewMobileCard(props: ScheduleOverviewCardProps) {
  return <CommonScheduleOverviewCard {...props} />;
}
