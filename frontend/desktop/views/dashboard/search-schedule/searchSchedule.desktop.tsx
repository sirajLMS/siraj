"use client";

import { Box, Typography } from "@mui/material";
import { SearchScheduleFormSectionShared } from "@/frontend/common/views/dashboard/search-schedule/components/searchScheduleFormSectionShared";
import type {
  SearchScheduleResultItem,
  SearchScheduleResultSummary,
  SearchScheduleViewModel,
} from "@/frontend/common/views/dashboard/search-schedule/useSearchScheduleViewModel";
import { getColumnCount } from "@/frontend/common/views/dashboard/search-schedule/utils";
import { computeSearchScheduleResults } from "@/frontend/common/views/dashboard/search-schedule/utils/searchScheduleResults.utils";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";
import { SearchScheduleFormDesktop } from "@/frontend/desktop/views/dashboard/search-schedule/components/searchScheduleForm.desktop";
import { SearchSchedulePaginationFooterDesktop } from "@/frontend/desktop/views/dashboard/search-schedule/components/searchSchedulePaginationFooter.desktop";
import { SearchScheduleResultsSkeletonDesktop } from "@/frontend/desktop/views/dashboard/search-schedule/components/searchScheduleResultsSkeleton.desktop";
import { TeacherAvailabilityGridDesktop } from "@/frontend/desktop/views/dashboard/search-schedule/components/teacherAvailabilityGrid.desktop";
import { TeacherAvailabilityMonthDrawerDesktop } from "@/frontend/desktop/views/dashboard/search-schedule/components/teacherAvailabilityMonthDrawer.desktop";
import type { SearchScheduleLabels } from "@/shared/locale/types/dashboard/core/searchSchedule";

interface SearchScheduleDesktopResultsProps {
  readonly searchResult: SearchScheduleResultSummary | null | undefined;
  readonly fromDate: string;
  readonly toDate: string;
  readonly labels: SearchScheduleLabels;
  readonly onOpenMonthDrawer: (teacher: SearchScheduleResultItem, anchorFromDate: string) => void;
}

function SearchScheduleDesktopResults({
  searchResult,
  fromDate,
  toDate,
  labels,
  onOpenMonthDrawer,
}: Readonly<SearchScheduleDesktopResultsProps>) {
  if (!searchResult) return null;

  const { totalGaps, activeTeachers, teacherSlots } = computeSearchScheduleResults(searchResult, fromDate, toDate);

  if (activeTeachers.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Typography variant="bodyLg" sx={theme => ({ color: theme.palette.text.secondary })}>
          {labels.noResults}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Typography variant="titleLg" sx={theme => ({ color: theme.palette.text.secondary })}>
        {labels.resultsCount(searchResult.totalCount ?? activeTeachers.length, totalGaps)}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {teacherSlots.map(({ teacher, dateColumns, gapsByDate }) => (
          <TeacherAvailabilityGridDesktop
            key={teacher.id ?? ""}
            labels={labels}
            teacher={teacher}
            fromDate={fromDate}
            dateColumns={dateColumns}
            gapsByDate={gapsByDate}
            onOpenMonthDrawer={onOpenMonthDrawer}
          />
        ))}
      </Box>
    </Box>
  );
}

export function SearchScheduleDesktopView({
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
    <DesktopPageContainer
      sx={theme => ({
        display: "flex",
        flexDirection: "column",
        gap: theme.layout.sectionGap,
        minHeight: `calc(100dvh - ${theme.layout.navbarHeight} - ${theme.layout.pageMargin} * 2)`,
      })}
    >
      <DesktopPageHeader title={labels.pageTitle} titleVariant="headlineLg" />

      <Box
        sx={{
          mt: 2,
          display: "flex",
          flexDirection: "column",
          flex: 1,
          gap: 2,
          minHeight: 0,
        }}
      >
        <SearchScheduleFormSectionShared
          FormComponent={SearchScheduleFormDesktop}
          error={error ? labels.errorLoading : null}
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

        {(() => {
          if (isInitialLoading) {
            return <SearchScheduleResultsSkeletonDesktop columnCount={columnCount} />;
          }
          if (searchResult) {
            return (
              <SearchScheduleDesktopResults
                searchResult={searchResult}
                fromDate={fromDate}
                toDate={toDate}
                labels={labels}
                onOpenMonthDrawer={rest.onOpenMonthDrawer}
              />
            );
          }
          return null;
        })()}

        {showPaginationFooter && pageInfo ? (
          <SearchSchedulePaginationFooterDesktop
            pageInfo={pageInfo}
            teacherCount={teacherCount}
            onPageChange={rest.onPageChange}
          />
        ) : null}
      </Box>

      <TeacherAvailabilityMonthDrawerDesktop
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
    </DesktopPageContainer>
  );
}
