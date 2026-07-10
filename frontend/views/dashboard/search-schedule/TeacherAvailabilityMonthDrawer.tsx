"use client";

import { useQuery } from "@apollo/client/react";
import { CalendarToday, ChevronLeft, ChevronRight, CloseOutlined } from "@mui/icons-material";
import { Box, CircularProgress, Drawer, IconButton, Typography } from "@mui/material";
import { addMonths, parse, subMonths } from "date-fns";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import type { AvailabilitySearchInput } from "@/frontend/graphql/generated/gql/graphql-types";
import { searchTeacherAvailabilityQueryDocument } from "@/frontend/graphql/sharedDocuments/scheduling/availability-search.documents";
import { useSearchScheduleStore } from "@/frontend/stores/searchScheduleStore";
import type { SearchScheduleResultItem } from "@/frontend/views/dashboard/search-schedule/SearchScheduleView";
import { buildTeacherMonthAvailabilityInput } from "@/frontend/views/dashboard/search-schedule/searchScheduleFilterUtils";
import { TeacherAvailabilityCalendarGrid } from "@/frontend/views/dashboard/search-schedule/TeacherAvailabilityCalendarGrid";
import type { TeacherAvailabilityGapItem } from "@/frontend/views/dashboard/search-schedule/TeacherAvailabilityDayPill";

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

export function TeacherAvailabilityMonthDrawer({
  open,
  teacher,
  anchorFromDate,
  onClose,
}: Readonly<TeacherAvailabilityMonthDrawerProps>) {
  const t = useTranslations("dashboard.searchSchedule");
  const draft = useSearchScheduleStore(state => state.draft);

  const [currentMonth, setCurrentMonth] = useState(() => parse(anchorFromDate, "yyyy-MM-dd", new Date()));

  useEffect(() => {
    if (open) {
      setCurrentMonth(parse(anchorFromDate, "yyyy-MM-dd", new Date()));
    }
  }, [anchorFromDate, open]);

  const monthInput = useMemo((): AvailabilitySearchInput | null => {
    if (!teacher?.id || !teacher.name) {
      return null;
    }

    return buildTeacherMonthAvailabilityInput(draft, { id: teacher.id, name: teacher.name }, currentMonth);
  }, [currentMonth, draft, teacher?.id, teacher?.name]);

      const emptyInput: AvailabilitySearchInput = {};
      const { data, loading, error } = useQuery(searchTeacherAvailabilityQueryDocument, {
        variables: monthInput ? { input: monthInput } : { input: emptyInput },
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

  const monthStr = currentMonth.toLocaleString("en-US", { month: "long" });
  const yearStr = currentMonth.getFullYear();

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
            <Typography variant="titleLg" sx={{ color: theme => theme.palette.primary.main }}>
              {t("monthScheduleTitle", { name: teacher?.name ?? "" })}
            </Typography>
          </Box>
          <IconButton aria-label={t("closeMonthSchedule")} onClick={onClose} size="small">
            <CloseOutlined />
          </IconButton>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, py: 2 }}>
          <IconButton
            aria-label={t("previousMonth")}
            onClick={() => setCurrentMonth(previous => subMonths(previous, 1))}
            sx={theme => ({
              transform: theme.direction === "rtl" ? "scaleX(-1)" : "scaleX(1)",
            })}
          >
            <ChevronLeft />
          </IconButton>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CalendarToday sx={theme => ({ fontSize: 20, color: theme.palette.primary.main })} />
            <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
              {monthStr} {yearStr}
            </Typography>
          </Box>
          <IconButton
            aria-label={t("nextMonth")}
            onClick={() => setCurrentMonth(previous => addMonths(previous, 1))}
            sx={theme => ({
              transform: theme.direction === "rtl" ? "scaleX(-1)" : "scaleX(1)",
            })}
          >
            <ChevronRight />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflow: "auto", px: 2, pb: 3 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={32} />
            </Box>
          ) : null}

          {error ? (
            <Typography color="error" sx={{ textAlign: "center", py: 4 }}>
              {t("monthScheduleError")}
            </Typography>
          ) : null}

          {!loading && !error ? (
            <TeacherAvailabilityCalendarGrid currentMonth={currentMonth} daysByDate={daysByDate} />
          ) : null}
        </Box>
      </Box>
    </Drawer>
  );
}
