"use client";

import { Box, Typography } from "@mui/material";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type {
  SearchScheduleMobileBodyProps,
  SearchScheduleMobileResultsProps,
} from "@/frontend/common/views/dashboard/search-schedule/types";
import { computeSearchScheduleResults } from "@/frontend/common/views/dashboard/search-schedule/utils/searchScheduleResults.utils";
import { MobileCardList } from "@/frontend/mobile/components/ui";
import { SearchScheduleResultsSkeletonMobile } from "@/frontend/mobile/views/dashboard/search-schedule/components/searchScheduleResultsSkeleton.mobile";
import { TeacherAvailabilityGridMobile } from "@/frontend/mobile/views/dashboard/search-schedule/components/teacherAvailabilityGrid.mobile";

export function SearchScheduleMobileBody({
  isInitialLoading,
  searchResult,
  columnCount,
  fromDate,
  toDate,
  labels,
  onOpenMonthDrawer,
  pageInfo,
  teacherCount,
  onPageChange,
  showPaginationFooter,
}: Readonly<SearchScheduleMobileBodyProps>) {
  if (isInitialLoading) {
    return <SearchScheduleResultsSkeletonMobile columnCount={columnCount} />;
  }

  if (!searchResult) {
    return null;
  }

  return (
    <SearchScheduleMobileResults
      searchResult={searchResult}
      fromDate={fromDate}
      toDate={toDate}
      labels={labels}
      onOpenMonthDrawer={onOpenMonthDrawer}
      pageInfo={pageInfo}
      teacherCount={teacherCount}
      onPageChange={onPageChange}
      showPagination={showPaginationFooter}
    />
  );
}

function SearchScheduleMobileResults({
  searchResult,
  fromDate,
  toDate,
  labels,
  onOpenMonthDrawer,
  pageInfo,
  teacherCount,
  onPageChange,
  showPagination,
}: Readonly<SearchScheduleMobileResultsProps>) {
  if (!searchResult) return null;

  const { totalGaps, activeTeachers, teacherSlots } = computeSearchScheduleResults(searchResult, fromDate, toDate);

  const paginationOptions =
    showPagination && pageInfo
      ? buildServerPaginationOptions({
          page: (pageInfo.currentPage ?? 1) - 1,
          pageSize: pageInfo.perPage ?? teacherCount ?? 10,
          totalCount: pageInfo.total ?? 0,
          onPageChange,
        })
      : false;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography
        variant="titleLg"
        sx={theme => ({
          px: 2,
          color: theme.palette.text.secondary,
        })}
      >
        {labels.resultsCount(searchResult.totalCount ?? activeTeachers.length, totalGaps)}
      </Typography>

      <MobileCardList
        rows={teacherSlots}
        emptyMessage={labels.noResults}
        getKey={({ teacher }) => teacher.id ?? ""}
        paginationOptions={paginationOptions}
        layout="edge-to-edge"
        renderItem={({ teacher, dateColumns, gapsByDate }) => (
          <TeacherAvailabilityGridMobile
            labels={labels}
            teacher={teacher}
            fromDate={fromDate}
            dateColumns={dateColumns}
            gapsByDate={gapsByDate}
            onOpenMonthDrawer={onOpenMonthDrawer}
          />
        )}
      />
    </Box>
  );
}
