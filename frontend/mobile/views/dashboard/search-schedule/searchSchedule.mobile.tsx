import { Box, Typography } from "@mui/material";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type {
  SearchScheduleMobileBodyProps,
  SearchScheduleMobileResultsProps,
} from "@/frontend/common/views/dashboard/search-schedule/types";
import type {
  SearchScheduleResultItem,
  SearchScheduleViewModel,
} from "@/frontend/common/views/dashboard/search-schedule/useSearchScheduleViewModel";
import {
  buildDateColumns,
  getColumnCount,
  groupGapsByDate,
} from "@/frontend/common/views/dashboard/search-schedule/utils";
import { MobileCardList, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { SearchScheduleFormMobile } from "@/frontend/mobile/views/dashboard/search-schedule/components/searchScheduleForm.mobile";
import { SearchScheduleResultsSkeletonMobile } from "@/frontend/mobile/views/dashboard/search-schedule/components/searchScheduleResultsSkeleton.mobile";
import { TeacherAvailabilityGridMobile } from "@/frontend/mobile/views/dashboard/search-schedule/components/teacherAvailabilityGrid.mobile";
import { TeacherAvailabilityMonthDrawerMobile } from "@/frontend/mobile/views/dashboard/search-schedule/components/teacherAvailabilityMonthDrawer.mobile";

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
  if (!searchResult) {
    return null;
  }

  const teachers = searchResult.teachers ?? [];
  const totalGaps = searchResult.totalGaps ?? 0;
  const activeTeachers = teachers.filter((teacher): teacher is SearchScheduleResultItem => teacher != null);

  const dateColumns = buildDateColumns(fromDate, toDate);
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
        rows={activeTeachers}
        emptyMessage={labels.noResults}
        getKey={teacher => teacher.id ?? ""}
        paginationOptions={paginationOptions}
        layout="edge-to-edge"
        renderItem={teacher => (
          <TeacherAvailabilityGridMobile
            labels={labels}
            teacher={teacher}
            fromDate={fromDate}
            dateColumns={dateColumns}
            gapsByDate={groupGapsByDate(teacher.gaps)}
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
  draft,
  onDraftChange,
  onSearch,
  onPageChange,
  selectedTeacher,
  onSelectTeacher,
  formFilterDrawerOpen,
  onOpenFormFilterDrawer,
  onCloseFormFilterDrawer,
  sortMenuAnchorEl,
  onSortMenuOpen,
  onSortMenuClose,
  onSortChange,
  monthDrawerOpen,
  monthDrawerTeacher,
  monthDrawerCurrentMonth,
  monthDrawerLoading,
  monthDrawerError,
  monthDrawerDaysByDate,
  onOpenMonthDrawer,
  onCloseMonthDrawer,
  onMonthDrawerChangeMonth,
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
        <SearchScheduleFormMobile
          labels={labels}
          draft={draft}
          isSearching={isInitialLoading}
          onDraftChange={onDraftChange}
          onSearch={onSearch}
          formFilterDrawerOpen={formFilterDrawerOpen}
          onOpenFormFilterDrawer={onOpenFormFilterDrawer}
          onCloseFormFilterDrawer={onCloseFormFilterDrawer}
          sortMenuAnchorEl={sortMenuAnchorEl}
          onSortMenuOpen={onSortMenuOpen}
          onSortMenuClose={onSortMenuClose}
          onSortChange={onSortChange}
          selectedTeacher={selectedTeacher}
          onSelectTeacher={onSelectTeacher}
        />

        {error ? (
          <Typography color="error" sx={{ px: 2 }}>
            {labels.errorLoading}
          </Typography>
        ) : null}

        <SearchScheduleMobileBody
          isInitialLoading={isInitialLoading}
          searchResult={searchResult}
          columnCount={columnCount}
          fromDate={fromDate}
          toDate={toDate}
          labels={labels}
          onOpenMonthDrawer={onOpenMonthDrawer}
          pageInfo={pageInfo}
          teacherCount={teacherCount}
          onPageChange={onPageChange}
          showPaginationFooter={showPaginationFooter}
        />
      </Box>

      <TeacherAvailabilityMonthDrawerMobile
        labels={labels}
        open={monthDrawerOpen}
        teacher={monthDrawerTeacher}
        currentMonth={monthDrawerCurrentMonth}
        monthDrawerLoading={monthDrawerLoading}
        monthDrawerError={monthDrawerError}
        daysByDate={monthDrawerDaysByDate}
        onClose={onCloseMonthDrawer}
        onMonthChange={onMonthDrawerChangeMonth}
      />
    </MobilePageContainer>
  );
}
