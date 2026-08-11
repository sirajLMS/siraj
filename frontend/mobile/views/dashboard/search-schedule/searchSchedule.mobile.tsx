import { Box, Typography } from "@mui/material";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { SearchScheduleFormSectionShared } from "@/frontend/common/views/dashboard/search-schedule/components/searchScheduleFormSectionShared";
import type {
  SearchScheduleMobileBodyProps,
  SearchScheduleMobileResultsProps,
} from "@/frontend/common/views/dashboard/search-schedule/types";
import type { SearchScheduleViewModel } from "@/frontend/common/views/dashboard/search-schedule/useSearchScheduleViewModel";
import { getColumnCount } from "@/frontend/common/views/dashboard/search-schedule/utils";
import {
  buildTeacherScheduleSlots,
  getActiveTeachers,
  getTotalGaps,
} from "@/frontend/common/views/dashboard/search-schedule/utils/searchScheduleResults.utils";
import { MobileCardList, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { SearchScheduleFormMobile } from "@/frontend/mobile/views/dashboard/search-schedule/components/searchScheduleForm.mobile";
import { SearchScheduleResultsSkeletonMobile } from "@/frontend/mobile/views/dashboard/search-schedule/components/searchScheduleResultsSkeleton.mobile";
import { TeacherAvailabilityGridMobile } from "@/frontend/mobile/views/dashboard/search-schedule/components/teacherAvailabilityGrid.mobile";
import { TeacherAvailabilityMonthDrawerMobile } from "@/frontend/mobile/views/dashboard/search-schedule/components/teacherAvailabilityMonthDrawer.mobile";

const MOBILE_ERROR_SX = { px: 2 } as const;

function SearchScheduleMobileBody({
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

  const totalGaps = getTotalGaps(searchResult);
  const activeTeachers = getActiveTeachers(searchResult);
  const teacherSlots = buildTeacherScheduleSlots(searchResult, fromDate, toDate);

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

export function SearchScheduleMobileView({
  labels,
  searchResult,
  fromDate,
  toDate,
  isInitialLoading,
  error,
  pageInfo,
  teacherCount,
  showPaginationFooter,
  ...rest
}: Readonly<SearchScheduleViewModel>) {
  const columnCount = getColumnCount(fromDate, toDate);

  return (
    <MobilePageContainer
      sx={theme => ({
        display: "flex",
        flexDirection: "column",
        gap: 1,
        minHeight: `calc(100dvh - ${theme.layout.navbarHeight} - ${theme.layout.bottomNavHeight} - ${theme.spacing(4)})`,
      })}
    >
      <MobilePageHeader title={labels.pageTitle} titleVariant="headlineLg" edgeToEdge={false} />

      <Box
        sx={{
          mt: 0,
          display: "flex",
          flexDirection: "column",
          flex: 1,
          gap: 1,
          minHeight: 0,
        }}
      >
        <SearchScheduleFormSectionShared
          FormComponent={SearchScheduleFormMobile}
          error={error ? labels.errorLoading : null}
          errorSx={MOBILE_ERROR_SX}
          labels={labels}
          draft={rest.draft}
          isSearching={isInitialLoading}
          onDraftChange={rest.onDraftChange}
          onSearch={rest.onSearch}
          formFilterDrawerOpen={rest.formFilterDrawerOpen}
          onOpenFormFilterDrawer={rest.onOpenFormFilterDrawer}
          onCloseFormFilterDrawer={rest.onCloseFormFilterDrawer}
          sortMenuAnchorEl={rest.sortMenuAnchorEl}
          onSortMenuOpen={rest.onSortMenuOpen}
          onSortMenuClose={rest.onSortMenuClose}
          onSortChange={rest.onSortChange}
          selectedTeacher={rest.selectedTeacher}
          onSelectTeacher={rest.onSelectTeacher}
        />

        <SearchScheduleMobileBody
          isInitialLoading={isInitialLoading}
          searchResult={searchResult}
          columnCount={columnCount}
          fromDate={fromDate}
          toDate={toDate}
          labels={labels}
          onOpenMonthDrawer={rest.onOpenMonthDrawer}
          pageInfo={pageInfo}
          teacherCount={teacherCount}
          onPageChange={rest.onPageChange}
          showPaginationFooter={showPaginationFooter}
        />
      </Box>

      <TeacherAvailabilityMonthDrawerMobile
        labels={labels}
        open={rest.monthDrawerOpen}
        teacher={rest.monthDrawerTeacher}
        currentMonth={rest.monthDrawerCurrentMonth}
        monthDrawerLoading={rest.monthDrawerLoading}
        monthDrawerError={rest.monthDrawerError}
        daysByDate={rest.monthDrawerDaysByDate}
        onClose={rest.onCloseMonthDrawer}
        onMonthChange={rest.onMonthDrawerChangeMonth}
      />
    </MobilePageContainer>
  );
}
