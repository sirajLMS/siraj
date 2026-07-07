// cspell:disable
"use client";

import { useQuery } from "@apollo/client/react";
import { Box, Typography } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { addDays, format } from "date-fns";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import type { DayOfWeek, SearchTeacherAvailabilityQuery } from "@/frontend/graphql/generated/gql/graphql";
import { AppPermission, AvailabilitySearchSortBy } from "@/frontend/graphql/generated/gql/graphql-types";
import { searchTeacherAvailabilityQueryDocument } from "@/frontend/graphql/sharedDocuments/availability-search.documents";
import { logger } from "@/frontend/utils/logger";
import { TeacherAvailabilityView } from "./TeacherAvailabilityView";
import type {
  AvailabilityEntry,
  AvailabilitySearchFormData,
  TeacherAvailabilityInsights,
  WeeklyAvailability,
} from "./types";

function buildGraphQLInput(formData: AvailabilitySearchFormData) {
  const fromTime = formData.fromTime
    ? `${String(formData.fromTime.getHours()).padStart(2, "0")}:${String(formData.fromTime.getMinutes()).padStart(2, "0")}`
    : "";
  const toTime = formData.toTime
    ? `${String(formData.toTime.getHours()).padStart(2, "0")}:${String(formData.toTime.getMinutes()).padStart(2, "0")}`
    : "";

  return {
    fromTime,
    toTime,
    fromDate: format(new Date(), "yyyy-MM-dd"),
    toDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
    gender: formData.gender,
    minAvailableDays: null,
    minTotalGaps: null,
    teacherNameSearch: null,
    daysOfWeek: null,
    sortBy: AvailabilitySearchSortBy.MostAvailableDays,
    paginationArgs: null,
  };
}

type AvailabilitySearchData = NonNullable<SearchTeacherAvailabilityQuery["searchTeacherAvailability"]>;

type AvailabilityGap = {
  id: string | null;
  teacherId: string | null;
  teacherName: string | null;
  teacherGender: string | null;
  dayOfWeek: DayOfWeek | null;
  gapStartTime: string | null;
  gapEndTime: string | null;
  timezone: string | null;
};

function addGapToGrid(grid: Record<string, Partial<Record<DayOfWeek, AvailabilityEntry[]>>>, gap: AvailabilityGap) {
  if (!gap?.dayOfWeek || !gap.gapStartTime || !gap.gapEndTime) return;

  const timeKey = `${gap.gapStartTime}-${gap.gapEndTime}`;
  if (!grid[timeKey]) {
    grid[timeKey] = {};
  }

  const entry: AvailabilityEntry = {
    id: gap.id ?? "",
    teacherName: gap.teacherName ?? "Unknown",
    localTime: gap.gapStartTime,
  };

  const timeSlot = grid[timeKey];
  if (timeSlot) {
    const day = gap.dayOfWeek;
    timeSlot[day] ??= [];
    timeSlot[day].push(entry);
  }
}

function transformToWeeklyAvailability(data: AvailabilitySearchData | null | undefined): WeeklyAvailability {
  if (!data?.teachers) return {};

  const grid: Record<string, Partial<Record<DayOfWeek, AvailabilityEntry[]>>> = {};

  for (const teacher of data.teachers) {
    if (!teacher?.gaps) continue;
    for (const gap of teacher.gaps) {
      addGapToGrid(grid, gap);
    }
  }

  return grid;
}

function computeInsights(data: AvailabilitySearchData | null | undefined): TeacherAvailabilityInsights {
  if (!data?.teachers) {
    return { peakLoad: "", availableStaff: 0, timezones: [] };
  }

  const timeCount: Record<string, number> = {};
  const tzSet = new Set<string>();

  for (const teacher of data.teachers) {
    if (teacher?.timezone) tzSet.add(teacher.timezone);
    if (!teacher?.gaps) continue;
    for (const gap of teacher.gaps) {
      if (!gap?.gapStartTime) continue;
      const key = gap.gapStartTime;
      timeCount[key] = (timeCount[key] ?? 0) + 1;
    }
  }

  let peakLoad = "";
  let maxCount = 0;
  for (const [key, count] of Object.entries(timeCount)) {
    if (count > maxCount) {
      maxCount = count;
      peakLoad = key;
    }
  }

  return {
    peakLoad,
    availableStaff: data.teachers.filter(t => t.gaps?.some(g => g.gapStartTime)).length,
    timezones: Array.from(tzSet),
  };
}

export function TeacherAvailabilityContainer({ teacherId }: Readonly<{ teacherId: string }>) {
  const t = useTranslations("dashboard.teacherAvailability");
  const tc = useTranslations("common");
  const notifications = useNotifications();

  const [searchInput, setSearchInput] = useState<AvailabilitySearchFormData>({
    fromTime: null,
    toTime: null,
    gender: null,
  });

  const [hasSearched, setHasSearched] = useState(false);

  const graphqlInput = hasSearched
    ? buildGraphQLInput(searchInput)
    : buildGraphQLInput({ fromTime: null, toTime: null, gender: null });

  const { data, loading, error, refetch } = useQuery(searchTeacherAvailabilityQueryDocument, {
    variables: { input: graphqlInput },
    skip: !hasSearched || !graphqlInput.fromTime || !graphqlInput.toTime,
    fetchPolicy: "cache-and-network",
  });

  const availability = useMemo(
    () => transformToWeeklyAvailability(data?.searchTeacherAvailability),
    [data?.searchTeacherAvailability]
  );

  const insights = useMemo(() => computeInsights(data?.searchTeacherAvailability), [data?.searchTeacherAvailability]);

  const defaultFilters = useMemo<AvailabilitySearchFormData>(
    () => ({
      fromTime: searchInput.fromTime,
      toTime: searchInput.toTime,
      gender: searchInput.gender,
    }),
    [searchInput]
  );

  const handleSearch = useCallback(
    (formData: AvailabilitySearchFormData) => {
      setSearchInput(formData);
      if (!formData.fromTime || !formData.toTime) {
        notifications.show(t("errors.missingTimeRange"), { severity: "warning", autoHideDuration: 4000 });
        return;
      }
      setHasSearched(true);
      const input = buildGraphQLInput(formData);
      void refetch({ input });
    },
    [refetch, notifications, t]
  );

  const handleBlockClick = useCallback(
    (entry: AvailabilityEntry) => {
      notifications.show(t("teacherSlotSelected", { name: entry.teacherName, id: teacherId }), {
        severity: "info",
        autoHideDuration: 4000,
      });
    },
    [notifications, t, teacherId]
  );

  const handleExportPdf = useCallback(() => {
    notifications.show(t("exportPdfComingSoon"), { severity: "info", autoHideDuration: 4000 });
  }, [notifications, t]);

  if (error) {
    logger.error("Error loading teacher availability:", { error });
    return (
      <RequirePermission permissions={[AppPermission.ScheduleSearchAvailability]}>
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <Typography sx={theme => ({ color: theme.palette.error.main })}>{tc("loadFailed")}</Typography>
        </Box>
      </RequirePermission>
    );
  }

  return (
    <RequirePermission permissions={[AppPermission.ScheduleSearchAvailability]}>
      <TeacherAvailabilityView
        availability={availability}
        insights={insights}
        defaultFilters={defaultFilters}
        loading={loading}
        onExportPdf={handleExportPdf}
        onSearch={handleSearch}
        onBlockClick={handleBlockClick}
      />
    </RequirePermission>
  );
}
