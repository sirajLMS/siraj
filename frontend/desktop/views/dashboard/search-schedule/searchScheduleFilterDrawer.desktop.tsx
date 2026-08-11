"use client";

import type { SearchScheduleFilterDrawerProps } from "@/frontend/common/views/dashboard/search-schedule/searchScheduleFilterDrawer.types";
import { SearchScheduleFilterDrawerShared } from "@/frontend/common/views/dashboard/search-schedule/searchScheduleFilterDrawerShared";

const DESKTOP_PAPER_SX = {
  width: 360,
  maxHeight: "100%",
  borderTopLeftRadius: 0,
  borderTopRightRadius: 0,
} as const;

export function SearchScheduleFilterDrawerDesktop({
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
      daysLabelId="search-schedule-days-label-desktop"
      anchor="right"
      paperSx={DESKTOP_PAPER_SX}
    />
  );
}
