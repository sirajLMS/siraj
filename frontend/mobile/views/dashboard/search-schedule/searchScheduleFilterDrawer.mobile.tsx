"use client";

import type { SearchScheduleFilterDrawerProps } from "@/frontend/common/views/dashboard/search-schedule/searchScheduleFilterDrawer.types";
import { SearchScheduleFilterDrawerShared } from "@/frontend/common/views/dashboard/search-schedule/searchScheduleFilterDrawerShared";

const MOBILE_PAPER_SX = {
  width: "100%",
  maxHeight: "85vh",
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
} as const;

export function SearchScheduleFilterDrawerMobile({
  labels,
  open,
  draft,
  onClose,
  onDraftChange,
  onApply,
}: Readonly<SearchScheduleFilterDrawerProps>) {
  return (
    <SearchScheduleFilterDrawerShared
      labels={labels}
      open={open}
      draft={draft}
      onClose={onClose}
      onDraftChange={onDraftChange}
      onApply={onApply}
      daysLabelId="search-schedule-days-label-mobile"
      anchor="bottom"
      paperSx={MOBILE_PAPER_SX}
    />
  );
}
