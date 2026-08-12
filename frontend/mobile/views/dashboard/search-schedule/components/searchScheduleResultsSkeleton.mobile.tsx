"use client";

import { edgeToEdgeCardShellSx } from "@/frontend/common/utils/sx/edgeToEdgeSx";
import { SearchScheduleResultsSkeletonShared } from "@/frontend/common/views/dashboard/search-schedule/components/searchScheduleResultsSkeletonShared";
import type { SearchScheduleResultsSkeletonProps } from "@/frontend/common/views/dashboard/search-schedule/types";

export function SearchScheduleResultsSkeletonMobile({
  columnCount,
  cardCount = 3,
}: Readonly<SearchScheduleResultsSkeletonProps>) {
  return (
    <SearchScheduleResultsSkeletonShared
      columnCount={columnCount}
      cardCount={cardCount}
      outerSx={{ mt: 1, display: "flex", flexDirection: "column", gap: 1 }}
      titleSx={{ mx: 2 }}
      cardListGap={2}
      cardShellExtraSx={edgeToEdgeCardShellSx}
      scrollRowVariant="mobile"
    />
  );
}
