"use client";

import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { RescheduleDateLabel } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  RescheduleTrackingCardListProps,
  TrackingRow,
} from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.types";
import { MobileCardList, MobileCardListItem, MobileEmptyState } from "@/frontend/mobile/components/ui";
import {
  TrackingCardBody,
  TrackingCardHeader,
} from "@/frontend/mobile/views/dashboard/reschedule/tracking/components/rescheduleTrackingCard.parts";
import { TrackingCardFooter } from "@/frontend/mobile/views/dashboard/reschedule/tracking/components/rescheduleTrackingCardFooter.parts";

export function RescheduleTrackingCardListMobile({
  rows,
  labels,
  onView,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: RescheduleTrackingCardListProps) {
  if (rows.length === 0) {
    return <MobileEmptyState title={labels.noEntries} />;
  }

  return (
    <MobileCardList<TrackingRow>
      rows={[...rows]}
      getKey={row => row.id ?? ""}
      layout="rounded"
      gap={2}
      renderItem={row => {
        const isLeave = row.dateLabel === RescheduleDateLabel.LeaveRequest;
        return (
          <MobileCardListItem
            variant="rounded"
            accentBorder={{
              color: isLeave ? "error" : "primary",
              side: "bottom",
              width: 3,
            }}
          >
            <TrackingCardHeader row={row} onView={onView} labels={labels} />
            <TrackingCardBody row={row} />
            <TrackingCardFooter row={row} labels={labels} isLeave={isLeave} />
          </MobileCardListItem>
        );
      }}
      paginationOptions={
        totalCount !== undefined && onPageChange !== undefined
          ? buildServerPaginationOptions({
              page: page ?? 0,
              pageSize: pageSize ?? 10,
              totalCount,
              onPageChange,
            })
          : { mode: "client" }
      }
    />
  );
}
