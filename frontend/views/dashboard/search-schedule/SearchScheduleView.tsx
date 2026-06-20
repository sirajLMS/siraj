"use client";

import { Box, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { TeacherAvailabilityGrid } from "./TeacherAvailabilityGrid";

export interface SearchScheduleResultItem {
  readonly id?: string | null;
  readonly name?: string | null;
  readonly gender?: string | null;
  readonly timezone?: string | null;
  readonly gaps?:
    | readonly ({
        readonly id?: string | null;
        readonly teacherId?: string | null;
        readonly teacherName?: string | null;
        readonly teacherGender?: string | null;
        readonly dayOfWeek?: string | null;
        readonly gapStartTime?: string | null;
        readonly gapEndTime?: string | null;
        readonly timezone?: string | null;
      } | null)[]
    | null;
}

export interface SearchScheduleResultSummary {
  readonly id?: string | null;
  readonly totalGaps?: number | null;
  readonly teachers?: readonly (SearchScheduleResultItem | null)[] | null;
}

interface SearchScheduleViewProps {
  readonly result: SearchScheduleResultSummary | null | undefined;
}

export function SearchScheduleView({ result }: Readonly<SearchScheduleViewProps>) {
  const t = useTranslations("dashboard.searchSchedule");

  const teachers = result?.teachers ?? [];
  const totalGaps = result?.totalGaps ?? 0;

  // Filter out any null/undefined teachers from mapping
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
        {t("resultsCount", { count: activeTeachers.length, gaps: totalGaps })}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {activeTeachers.map(teacher => (
          <TeacherAvailabilityGrid key={teacher.id ?? ""} teacher={teacher} />
        ))}
      </Box>
    </Box>
  );
}
