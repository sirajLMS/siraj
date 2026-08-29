"use client";

import type { ReactNode } from "react";
import { scheduleOverviewCardShellSx } from "@/frontend/common/views/dashboard/admin/home/components/scheduleOverviewSurfaces";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import type {
  ScheduleOverviewDataHeaders,
  ScheduleOverviewDataStatusLabels,
} from "@/frontend/common/views/dashboard/types/dashboard";
import { MobileCardListItem } from "@/frontend/mobile/components/ui";
import { ScheduleOverviewMobileCard } from "@/frontend/mobile/views/dashboard/admin/home/scheduleOverview/components/scheduleOverviewCard.mobile";

/** Label bundle the schedule overview card renderer needs. */
export interface ScheduleOverviewMobileCardLabels {
  readonly columns: ScheduleOverviewDataHeaders;
  readonly status: ScheduleOverviewDataStatusLabels;
  readonly detailsLabel: string;
}

/** Builds the card-list `renderItem` that wraps each row in the shared card shell. */
export function createScheduleOverviewMobileCardRenderer(
  labels: ScheduleOverviewMobileCardLabels,
  showTimezones: boolean,
  locale: string
): (row: DailyScheduleRow) => ReactNode {
  return function ScheduleOverviewMobileCardItem(row: DailyScheduleRow): ReactNode {
    return (
      <MobileCardListItem variant="edge-to-edge" sx={scheduleOverviewCardShellSx}>
        <ScheduleOverviewMobileCard
          row={row}
          headers={labels.columns}
          statusLabels={labels.status}
          detailsLabel={labels.detailsLabel}
          showTimezones={showTimezones}
          locale={locale}
        />
      </MobileCardListItem>
    );
  };
}
