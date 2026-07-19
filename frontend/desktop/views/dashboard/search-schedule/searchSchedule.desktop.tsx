"use client";

import { Box, Typography } from "@mui/material";
import type {
  SearchScheduleResultItem,
  SearchScheduleResultSummary,
  SearchScheduleViewModel,
} from "@/frontend/common/views/dashboard/search-schedule/useSearchScheduleViewModel";
import {
  buildDateColumns,
  getColumnCount,
  groupGapsByDate,
} from "@/frontend/common/views/dashboard/search-schedule/utils";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";
import { SearchScheduleFormDesktop } from "@/frontend/desktop/views/dashboard/search-schedule/components/searchScheduleForm.desktop";
import { SearchSchedulePaginationFooterDesktop } from "@/frontend/desktop/views/dashboard/search-schedule/components/searchSchedulePaginationFooter.desktop";
import { SearchScheduleResultsSkeletonDesktop } from "@/frontend/desktop/views/dashboard/search-schedule/components/searchScheduleResultsSkeleton.desktop";
import { TeacherAvailabilityGridDesktop } from "@/frontend/desktop/views/dashboard/search-schedule/components/teacherAvailabilityGrid.desktop";
import { TeacherAvailabilityMonthDrawerDesktop } from "@/frontend/desktop/views/dashboard/search-schedule/components/teacherAvailabilityMonthDrawer.desktop";
import { useAppTranslation } from "@/shared/locale";

interface SearchScheduleDesktopResultsProps {
  readonly searchResult: SearchScheduleResultSummary | null | undefined;
  readonly fromDate: string;
  readonly toDate: string;
  readonly t: ReturnType<typeof useAppTranslation>["dashboardTranslations"]["coreSearchSchedule"];
  readonly onOpenMonthDrawer: (teacher: SearchScheduleResultItem, anchorFromDate: string) => void;
}

function SearchScheduleDesktopResults({
  searchResult,
  fromDate,
  toDate,
  t,
  onOpenMonthDrawer,
}: Readonly<SearchScheduleDesktopResultsProps>) {
  if (!searchResult) {
    return null;
  }

  const teachers = searchResult.teachers ?? [];
  const totalGaps = searchResult.totalGaps ?? 0;
  const activeTeachers = teachers.filter((teacher): teacher is SearchScheduleResultItem => {
    return teacher !== null && teacher !== undefined;
  });

  if (activeTeachers.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Typography variant="bodyLg" sx={theme => ({ color: theme.palette.text.secondary })}>
          {t.noResults}
        </Typography>
      </Box>
    );
  }

  const dateColumns = buildDateColumns(fromDate, toDate);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Typography variant="titleLg" sx={theme => ({ color: theme.palette.text.secondary })}>
        {t.resultsCount(searchResult.totalCount ?? activeTeachers.length, totalGaps)}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {activeTeachers.map(teacher => {
          const gapsByDate = groupGapsByDate(teacher.gaps);
          return (
            <TeacherAvailabilityGridDesktop
              key={teacher.id ?? ""}
              teacher={teacher}
              fromDate={fromDate}
              dateColumns={dateColumns}
              gapsByDate={gapsByDate}
              onOpenMonthDrawer={onOpenMonthDrawer}
            />
          );
        })}
      </Box>
    </Box>
  );
}

export function SearchScheduleDesktopView({
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
  const t = useAppTranslation().dashboardTranslations.coreSearchSchedule;
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
      <DesktopPageHeader title={t.pageTitle} titleVariant="headlineLg" />

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
        <SearchScheduleFormDesktop
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

        {error ? <Typography color="error">{t.errorLoading}</Typography> : null}

        {isInitialLoading ? (
          <SearchScheduleResultsSkeletonDesktop columnCount={columnCount} />
        ) : searchResult || undefined ? (
          <SearchScheduleDesktopResults
            searchResult={searchResult}
            fromDate={fromDate}
            toDate={toDate}
            t={t}
            onOpenMonthDrawer={onOpenMonthDrawer}
          />
        ) : null}

        {showPaginationFooter && pageInfo ? (
          <SearchSchedulePaginationFooterDesktop
            pageInfo={pageInfo}
            teacherCount={teacherCount}
            onPageChange={onPageChange}
          />
        ) : null}
      </Box>

      <TeacherAvailabilityMonthDrawerDesktop
        open={monthDrawerOpen}
        teacher={monthDrawerTeacher}
        currentMonth={monthDrawerCurrentMonth}
        monthDrawerLoading={monthDrawerLoading}
        monthDrawerError={monthDrawerError}
        daysByDate={monthDrawerDaysByDate}
        onClose={onCloseMonthDrawer}
        onMonthChange={onMonthDrawerChangeMonth}
      />
    </DesktopPageContainer>
  );
}
