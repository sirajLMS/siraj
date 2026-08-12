"use client";

import type { ReactNode } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import {
  ScheduleOverviewCardSkeleton,
  ScheduleOverviewEmptyState,
} from "@/frontend/common/views/dashboard/admin/home/components/ScheduleOverviewCardList";
import {
  scheduleOverviewCardShellSx,
  scheduleOverviewListCanvasSx,
} from "@/frontend/common/views/dashboard/admin/home/components/scheduleOverviewSurfaces";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import { MobileCardList, MobileCardListItem } from "@/frontend/mobile/components/ui";

export interface ScheduleOverviewMobileCardListProps {
  readonly rows: readonly DailyScheduleRow[];
  readonly loading: boolean;
  readonly emptyMessage: string;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number | undefined;
  readonly onPageChange: (page: number) => void;
  readonly renderItem: (row: DailyScheduleRow) => ReactNode;
}

function renderSkeleton(): ReactNode {
  return (
    <MobileCardListItem variant="edge-to-edge" sx={scheduleOverviewCardShellSx}>
      <ScheduleOverviewCardSkeleton />
    </MobileCardListItem>
  );
}

function renderEmptyState(msg: string): ReactNode {
  return (
    <MobileCardListItem variant="edge-to-edge" sx={scheduleOverviewCardShellSx}>
      <ScheduleOverviewEmptyState message={msg} />
    </MobileCardListItem>
  );
}

export function ScheduleOverviewMobileCardList({
  rows,
  loading,
  emptyMessage,
  page,
  pageSize,
  totalCount,
  onPageChange,
  renderItem,
}: Readonly<ScheduleOverviewMobileCardListProps>) {
  return (
    <MobileCardList<DailyScheduleRow>
      rows={rows}
      loading={loading}
      emptyMessage={emptyMessage}
      renderSkeleton={renderSkeleton}
      renderEmptyState={renderEmptyState}
      gap={0}
      layout="edge-to-edge"
      sx={scheduleOverviewListCanvasSx}
      getKey={row => row.id ?? ""}
      renderItem={renderItem}
      paginationOptions={buildServerPaginationOptions({
        page,
        pageSize,
        totalCount: totalCount ?? 0,
        onPageChange,
      })}
    />
  );
}
