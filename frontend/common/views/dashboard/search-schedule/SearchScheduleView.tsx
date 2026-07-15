"use client";

import { Box, Typography } from "@mui/material";
import { differenceInCalendarDays, parse } from "date-fns";
import { SearchScheduleResultsSkeleton } from "@/frontend/common/views/dashboard/search-schedule/SearchScheduleResultsSkeleton";
import { TeacherAvailabilityGrid } from "@/frontend/common/views/dashboard/search-schedule/TeacherAvailabilityGrid";
import { useAppTranslation } from "@/shared/locale/client";

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

export interface SearchSchedulePageInfo {
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
}

function getColumnCount(fromDate: string, toDate: string): number {
  const start = parse(fromDate, "yyyy-MM-dd", new Date());
  const end = parse(toDate, "yyyy-MM-dd", new Date());
  return Math.max(differenceInCalendarDays(end, start) + 1, 1);
}

export function SearchScheduleView({ result, fromDate, toDate, isInitialLoading }: Readonly<SearchScheduleViewProps>) {
  const t = useAppTranslation("dashboard.core.searchSchedule");
  const columnCount = getColumnCount(fromDate, toDate);

  if (isInitialLoading) {
    return <SearchScheduleResultsSkeleton columnCount={columnCount} />;
  }

  const teachers = result?.teachers ?? [];
  const totalGaps = result?.totalGaps ?? 0;
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
    <Box sx={{ mt: { xs: 1, md: 3 }, display: "flex", flexDirection: "column", gap: { xs: 1, md: 2 } }}>
      <Typography
        variant="titleLg"
        sx={theme => ({
          px: { xs: 2, md: 0 },
          color: theme.palette.text.secondary,
        })}
      >
        {t.resultsCount(result?.totalCount ?? activeTeachers.length, totalGaps)}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, md: 1.5 } }}>
        {activeTeachers.map(teacher => (
          <TeacherAvailabilityGrid key={teacher.id ?? ""} teacher={teacher} fromDate={fromDate} toDate={toDate} />
        ))}
      </Box>
    </Box>
  );
}
