"use client";

import { Box, Typography } from "@mui/material";
import { differenceInCalendarDays, parse } from "date-fns";
import { useTranslations } from "next-intl";
import { PaginationControls } from "@/frontend/components/ui/PaginationControls";
import { SearchScheduleResultsSkeleton } from "./SearchScheduleResultsSkeleton";
import { TeacherAvailabilityGrid } from "./TeacherAvailabilityGrid";

export interface SearchScheduleResultItem {
  readonly id?: string | null;
  readonly name?: string | null;
  readonly gender?: string | null;
  readonly timezone?: string | null;
  readonly availableDaysCount?: number | null;
  readonly gaps?:
    | readonly ({
        readonly id?: string | null;
        readonly teacherId?: string | null;
        readonly teacherName?: string | null;
        readonly teacherGender?: string | null;
        readonly dayOfWeek?: string | null;
        readonly calendarDate?: string | null;
        readonly gapStartTime?: string | null;
        readonly gapEndTime?: string | null;
        readonly timezone?: string | null;
      } | null)[]
    | null;
}

interface SearchSchedulePageInfo {
  readonly count?: number | null;
  readonly currentPage?: number | null;
  readonly hasMorePages?: boolean | null;
  readonly lastPage?: number | null;
  readonly perPage?: number | null;
  readonly total?: number | null;
}

export interface SearchScheduleResultSummary {
  readonly id?: string | null;
  readonly totalGaps?: number | null;
  readonly totalCount?: number | null;
  readonly pageInfo?: SearchSchedulePageInfo | null;
  readonly teachers?: readonly (SearchScheduleResultItem | null)[] | null;
}

interface SearchScheduleViewProps {
  readonly result: SearchScheduleResultSummary | null | undefined;
  readonly fromDate: string;
  readonly toDate: string;
  readonly isInitialLoading: boolean;
  readonly onPageChange: (page: number) => void;
}

function getColumnCount(fromDate: string, toDate: string): number {
  const start = parse(fromDate, "yyyy-MM-dd", new Date());
  const end = parse(toDate, "yyyy-MM-dd", new Date());
  return Math.max(differenceInCalendarDays(end, start) + 1, 1);
}

export function SearchScheduleView({
  result,
  fromDate,
  toDate,
  isInitialLoading,
  onPageChange,
}: Readonly<SearchScheduleViewProps>) {
  const t = useTranslations("dashboard.searchSchedule");
  const columnCount = getColumnCount(fromDate, toDate);

  if (isInitialLoading) {
    return <SearchScheduleResultsSkeleton columnCount={columnCount} />;
  }

  const teachers = result?.teachers ?? [];
  const totalGaps = result?.totalGaps ?? 0;
  const pageInfo = result?.pageInfo;
  const activeTeachers = teachers.filter((teacher): teacher is SearchScheduleResultItem => {
    return teacher !== null && teacher !== undefined;
  });

  if (activeTeachers.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Typography variant="bodyLg" sx={theme => ({ color: theme.palette.text.secondary })}>
          {t("noResults")}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="titleLg" sx={theme => ({ color: theme.palette.text.secondary, mb: 2 })}>
        {t("resultsCount", {
          count: result?.totalCount ?? activeTeachers.length,
          gaps: totalGaps,
        })}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {activeTeachers.map(teacher => (
          <TeacherAvailabilityGrid key={teacher.id ?? ""} teacher={teacher} fromDate={fromDate} toDate={toDate} />
        ))}
      </Box>

      {pageInfo && (pageInfo.total ?? 0) > 0 && (
        <Box sx={{ mt: 3 }}>
          <PaginationControls
            page={(pageInfo.currentPage ?? 1) - 1}
            pageCount={pageInfo.lastPage ?? 1}
            rowCount={pageInfo.total ?? 0}
            pageSize={pageInfo.perPage ?? activeTeachers.length}
            onPageChange={onPageChange}
          />
        </Box>
      )}
    </Box>
  );
}
