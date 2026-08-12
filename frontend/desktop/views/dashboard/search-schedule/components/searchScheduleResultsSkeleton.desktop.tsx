"use client";

import { SearchScheduleResultsSkeletonShared } from "@/frontend/common/views/dashboard/search-schedule/components/searchScheduleResultsSkeletonShared";
import type { SearchScheduleResultsSkeletonProps } from "@/frontend/common/views/dashboard/search-schedule/types";

export function SearchScheduleResultsSkeletonDesktop({
  columnCount,
  cardCount = 3,
}: Readonly<SearchScheduleResultsSkeletonProps>) {
  return (
    <SearchScheduleResultsSkeletonShared columnCount={columnCount} cardCount={cardCount} scrollRowVariant="desktop" />
  );
}
