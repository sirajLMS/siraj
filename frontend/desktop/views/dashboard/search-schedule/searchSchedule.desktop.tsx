"use client";

import { Box, Typography } from "@mui/material";
import { differenceInCalendarDays, parse } from "date-fns";
import type {
  SearchScheduleResultItem,
  SearchScheduleResultSummary,
  SearchScheduleViewModel,
} from "@/frontend/common/views/dashboard/search-schedule/useSearchScheduleViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";
import { SearchScheduleFormDesktop } from "@/frontend/desktop/views/dashboard/search-schedule/components/searchScheduleForm.desktop";
import { SearchSchedulePaginationFooterDesktop } from "@/frontend/desktop/views/dashboard/search-schedule/components/searchSchedulePaginationFooter.desktop";
import { SearchScheduleResultsSkeletonDesktop } from "@/frontend/desktop/views/dashboard/search-schedule/components/searchScheduleResultsSkeleton.desktop";
import { TeacherAvailabilityGridDesktop } from "@/frontend/desktop/views/dashboard/search-schedule/components/teacherAvailabilityGrid.desktop";
import { useAppTranslation } from "@/shared/locale";

function getColumnCount(fromDate: string, toDate: string): number {
  const start = parse(fromDate, "yyyy-MM-dd", new Date());
  const end = parse(toDate, "yyyy-MM-dd", new Date());
  return Math.max(differenceInCalendarDays(end, start) + 1, 1);
}

interface SearchScheduleDesktopResultsProps {
  readonly searchResult: SearchScheduleResultSummary | null | undefined;
  readonly fromDate: string;
  readonly toDate: string;
  readonly t: ReturnType<typeof useAppTranslation>["dashboardTranslations"]["coreSearchSchedule"];
}

function SearchScheduleDesktopResults({
  searchResult,
  fromDate,
  toDate,
  t,
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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Typography
        variant="titleLg"
        sx={theme => ({
          color: theme.palette.text.secondary,
        })}
      >
        {t.resultsCount(searchResult.totalCount ?? activeTeachers.length, totalGaps)}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {activeTeachers.map(teacher => (
          <TeacherAvailabilityGridDesktop
            key={teacher.id ?? ""}
            teacher={teacher}
            fromDate={fromDate}
            toDate={toDate}
          />
        ))}
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
        />

        {error ? <Typography color="error">{t.errorLoading}</Typography> : null}

        {isInitialLoading ? (
          <SearchScheduleResultsSkeletonDesktop columnCount={columnCount} />
        ) : searchResult || undefined ? (
          <SearchScheduleDesktopResults searchResult={searchResult} fromDate={fromDate} toDate={toDate} t={t} />
        ) : null}

        {showPaginationFooter && pageInfo ? (
          <SearchSchedulePaginationFooterDesktop
            pageInfo={pageInfo}
            teacherCount={teacherCount}
            onPageChange={onPageChange}
          />
        ) : null}
      </Box>
    </DesktopPageContainer>
  );
}
