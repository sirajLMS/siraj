"use client";

import { useQuery } from "@apollo/client/react";
import { CalendarToday, ChevronLeft, ChevronRight, CloseOutlined } from "@mui/icons-material";
import { Box, CircularProgress, Drawer, IconButton, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { addMonths, parse, subMonths } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import {
  type AvailabilitySearchInput,
  AvailabilitySearchSortBy,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { searchTeacherAvailabilityQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useSearchScheduleStore } from "@/frontend/common/stores/searchScheduleStore";
import type { SearchScheduleResultItem } from "@/frontend/common/views/dashboard/search-schedule/SearchScheduleView";
import { buildTeacherMonthAvailabilityInput } from "@/frontend/common/views/dashboard/search-schedule/searchScheduleFilterUtils";
import { TeacherAvailabilityCalendarGrid } from "@/frontend/common/views/dashboard/search-schedule/TeacherAvailabilityCalendarGrid";
import type { TeacherAvailabilityGapItem } from "@/frontend/common/views/dashboard/search-schedule/TeacherAvailabilityDayPill";
import { useAppTranslation } from "@/shared/locale";

interface TeacherAvailabilityMonthDrawerProps {
  readonly open: boolean;
  readonly teacher: SearchScheduleResultItem | null;
  readonly anchorFromDate: string;
  readonly onClose: () => void;
}

function groupGapsByDayOfMonth(
  gaps: readonly TeacherAvailabilityGapItem[] | null | undefined,
  month: Date
): Partial<Record<number, readonly TeacherAvailabilityGapItem[]>> {
  const grouped: Record<number, TeacherAvailabilityGapItem[]> = {};

  for (const gap of gaps ?? []) {
    if (!gap) {
      continue;
    }

    const calendarDate = gap.calendarDate;
    if (!calendarDate) {
      continue;
    }

    const parsed = parse(calendarDate, "yyyy-MM-dd", new Date());
    if (parsed.getMonth() !== month.getMonth() || parsed.getFullYear() !== month.getFullYear()) {
      continue;
    }

    const day = parsed.getDate();
    grouped[day] = [...(grouped[day] ?? []), gap];
  }

  return grouped;
}

const EMPTY_INPUT: AvailabilitySearchInput = {
  fromDate: "",
  toDate: "",
  fromTime: "",
  toTime: "",
  gender: null,
  minAvailableDays: null,
  minTotalGaps: null,
  teacherNameSearch: null,
  daysOfWeek: null,
  sortBy: AvailabilitySearchSortBy.MostAvailableDays,
  paginationArgs: {
    first: null,
    page: null,
    skip: null,
    after: null,
    before: null,
    last: null,
    maxCount: null,
  },
};

interface MonthDrawerQueryResult {
  readonly daysByDate: Partial<Record<number, readonly TeacherAvailabilityGapItem[]>>;
  readonly loading: boolean;
  readonly error: unknown;
}

function useMonthDrawerQuery(
  open: boolean,
  teacher: SearchScheduleResultItem | null,
  currentMonth: Date
): MonthDrawerQueryResult {
  const draft = useSearchScheduleStore(state => state.draft);

  const monthInput = useMemo((): AvailabilitySearchInput | null => {
    if (!teacher?.id || !teacher.name) {
      return null;
    }

    return buildTeacherMonthAvailabilityInput(draft, { id: teacher.id, name: teacher.name }, currentMonth);
  }, [currentMonth, draft, teacher?.id, teacher?.name]);

  const { data, loading, error } = useQuery(searchTeacherAvailabilityQueryDocument, {
    variables: monthInput ? { input: monthInput } : { input: EMPTY_INPUT },
    skip: !open || monthInput === null,
    fetchPolicy: "cache-and-network",
  });

  const monthTeacher = useMemo(() => {
    const teachers = data?.searchTeacherAvailability?.teachers ?? [];
    return teachers.find(item => item?.id === teacher?.id) ?? teachers[0] ?? null;
  }, [data?.searchTeacherAvailability?.teachers, teacher?.id]);

  const daysByDate = useMemo(
    () => groupGapsByDayOfMonth(monthTeacher?.gaps, currentMonth),
    [currentMonth, monthTeacher?.gaps]
  );

  return { daysByDate, loading, error };
}

function DrawerHeader({ title, onClose }: { readonly title: string; readonly onClose: () => void }) {
  const t = useAppTranslation().dashboardTranslations.coreSearchSchedule;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        px: 2,
        py: 1.5,
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="titleLg" sx={{ color: (theme: Theme) => theme.palette.primary.main }}>
          {title}
        </Typography>
      </Box>
      <IconButton aria-label={t.closeMonthSchedule} onClick={onClose} size="small">
        <CloseOutlined />
      </IconButton>
    </Box>
  );
}

function MonthNavigator({
  currentMonth,
  onMonthChange,
}: {
  readonly currentMonth: Date;
  readonly onMonthChange: (fn: (prev: Date) => Date) => void;
}) {
  const t = useAppTranslation().dashboardTranslations.coreSearchSchedule;
  const monthStr = currentMonth.toLocaleString("en-US", { month: "long" });
  const yearStr = currentMonth.getFullYear();

  const flipSx = (theme: Theme) => ({
    transform: theme.direction === "rtl" ? "scaleX(-1)" : "scaleX(1)",
  });

  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, py: 2 }}>
      <IconButton aria-label={t.previousMonth} onClick={() => onMonthChange(prev => subMonths(prev, 1))} sx={flipSx}>
        <ChevronLeft />
      </IconButton>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <CalendarToday sx={(theme: Theme) => ({ fontSize: 20, color: theme.palette.primary.main })} />
        <Typography variant="titleLg" sx={(theme: Theme) => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
          {monthStr} {yearStr}
        </Typography>
      </Box>
      <IconButton aria-label={t.nextMonth} onClick={() => onMonthChange(prev => addMonths(prev, 1))} sx={flipSx}>
        <ChevronRight />
      </IconButton>
    </Box>
  );
}

function DrawerContent({
  loading,
  error,
  currentMonth,
  daysByDate,
}: {
  readonly loading: boolean;
  readonly error: unknown;
  readonly currentMonth: Date;
  readonly daysByDate: Partial<Record<number, readonly TeacherAvailabilityGapItem[]>>;
}) {
  const t = useAppTranslation().dashboardTranslations.coreSearchSchedule;
  return (
    <Box sx={{ flex: 1, overflow: "auto", px: 2, pb: 3 }}>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      ) : null}

      {error ? (
        <Typography color="error" sx={{ textAlign: "center", py: 4 }}>
          {t.monthScheduleError}
        </Typography>
      ) : null}

      {!loading && !error ? (
        <TeacherAvailabilityCalendarGrid currentMonth={currentMonth} daysByDate={daysByDate} />
      ) : null}
    </Box>
  );
}

export function TeacherAvailabilityMonthDrawer({
  open,
  teacher,
  anchorFromDate,
  onClose,
}: Readonly<TeacherAvailabilityMonthDrawerProps>) {
  const t = useAppTranslation().dashboardTranslations.coreSearchSchedule;

  const [currentMonth, setCurrentMonth] = useState(() => parse(anchorFromDate, "yyyy-MM-dd", new Date()));

  useEffect(() => {
    if (open) {
      setCurrentMonth(parse(anchorFromDate, "yyyy-MM-dd", new Date()));
    }
  }, [anchorFromDate, open]);

  const { daysByDate, loading, error } = useMonthDrawerQuery(open, teacher, currentMonth);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: "100%",
            maxWidth: "100vw",
          },
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <DrawerHeader title={t.monthScheduleTitle(teacher?.name ?? "")} onClose={onClose} />
        <MonthNavigator currentMonth={currentMonth} onMonthChange={setCurrentMonth} />
        <DrawerContent loading={loading} error={error} currentMonth={currentMonth} daysByDate={daysByDate} />
      </Box>
    </Drawer>
  );
}
