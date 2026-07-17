"use client";

import { Box, Typography } from "@mui/material";
import { differenceInCalendarDays, parse } from "date-fns";
import type {
  SearchScheduleResultItem,
  SearchScheduleResultSummary,
  SearchScheduleViewModel,
} from "@/frontend/common/views/dashboard/search-schedule/useSearchScheduleViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { SearchScheduleFormMobile } from "@/frontend/mobile/views/dashboard/search-schedule/components/searchScheduleForm.mobile";
import { SearchSchedulePaginationFooterMobile } from "@/frontend/mobile/views/dashboard/search-schedule/components/searchSchedulePaginationFooter.mobile";
import { SearchScheduleResultsSkeletonMobile } from "@/frontend/mobile/views/dashboard/search-schedule/components/searchScheduleResultsSkeleton.mobile";
import { TeacherAvailabilityGridMobile } from "@/frontend/mobile/views/dashboard/search-schedule/components/teacherAvailabilityGrid.mobile";
import { useAppTranslation } from "@/shared/locale";

function getColumnCount(fromDate: string, toDate: string): number {
  const start = parse(fromDate, "yyyy-MM-dd", new Date());
  const end = parse(toDate, "yyyy-MM-dd", new Date());
  return Math.max(differenceInCalendarDays(end, start) + 1, 1);
}

interface SearchScheduleMobileResultsProps {
  readonly searchResult: SearchScheduleResultSummary | null | undefined;
  readonly fromDate: string;
  readonly toDate: string;
  readonly t: ReturnType<typeof useAppTranslation>["dashboardTranslations"]["coreSearchSchedule"];
}

function SearchScheduleMobileResults({
  searchResult,
  fromDate,
  toDate,
  t,
}: Readonly<SearchScheduleMobileResultsProps>) {
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
      <Box sx={{ textAlign: "center", py: 6, px: 2 }}>
        <Typography variant="bodyLg" sx={theme => ({ color: theme.palette.text.secondary })}>
          {t.noResults}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography
        variant="titleLg"
        sx={theme => ({
          px: 2,
          color: theme.palette.text.secondary,
        })}
      >
        {t.resultsCount(searchResult.totalCount ?? activeTeachers.length, totalGaps)}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {activeTeachers.map(teacher => (
          <TeacherAvailabilityGridMobile key={teacher.id ?? ""} teacher={teacher} fromDate={fromDate} toDate={toDate} />
        ))}
      </Box>
    </Box>
  );
}

export function SearchScheduleMobileView({
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
    <MobilePageContainer
      sx={theme => ({
        display: "flex",
        flexDirection: "column",
        gap: 1,
        minHeight: `calc(100dvh - ${theme.layout.navbarHeight} - ${theme.layout.bottomNavHeight} - ${theme.spacing(4)})`,
      })}
    >
      <MobilePageHeader title={t.pageTitle} titleVariant="headlineLg" edgeToEdge={false} />

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
          draft={draft}
          isSearching={isInitialLoading}
          onDraftChange={onDraftChange}
          onSearch={onSearch}
        />

        {error ? (
          <Typography color="error" sx={{ px: 2 }}>
            {t.errorLoading}
          </Typography>
        ) : null}

        {isInitialLoading ? (
          <SearchScheduleResultsSkeletonMobile columnCount={columnCount} />
        ) : searchResult || undefined ? (
          <SearchScheduleMobileResults searchResult={searchResult} fromDate={fromDate} toDate={toDate} t={t} />
        ) : null}

        {showPaginationFooter && pageInfo ? (
          <SearchSchedulePaginationFooterMobile
            pageInfo={pageInfo}
            teacherCount={teacherCount}
            onPageChange={onPageChange}
          />
        ) : null}
      </Box>
    </MobilePageContainer>
  );
}
