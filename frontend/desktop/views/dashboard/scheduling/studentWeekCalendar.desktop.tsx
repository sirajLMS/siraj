"use client";

import { ChevronLeftOutlined, ChevronRightOutlined } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import { useMemo, useState } from "react";
import { formatTime, getDateTimeFormatter } from "@/frontend/common/components/intl/dateFormat";
import { SessionActions } from "@/frontend/common/views/dashboard/scheduling/session-actions/SessionActions";
import {
  addDays,
  type StudentClassRow,
  sameDay,
  useStudentWeekCalendarViewModel,
} from "@/frontend/common/views/dashboard/scheduling/student-week-calendar/useStudentWeekCalendarViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7);

// Module-level options objects so getDateTimeFormatter hits its WeakMap
// tier-1 cache by options identity instead of allocating fresh instances.
const HOUR_NUMERIC_OPTIONS: Intl.DateTimeFormatOptions = { hour: "numeric", hour12: true };
const WEEKDAY_SHORT_OPTIONS: Intl.DateTimeFormatOptions = { weekday: "short" };
const MONTH_DAY_OPTIONS: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" };
const MONTH_DAY_YEAR_OPTIONS: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" };

function formatHour(hour: number, locale: string): string {
  return getDateTimeFormatter(getLatnLocaleTag(locale), HOUR_NUMERIC_OPTIONS).format(new Date(0, 0, 0, hour));
}

function OutcomeChip({ outcome }: Readonly<{ outcome: string }>) {
  const colorMap: Record<string, "default" | "success" | "error" | "warning" | "info"> = {
    PENDING: "default",
    COMPLETED: "success",
    CANCELLED: "error",
    ABSENT: "warning",
    LATE: "info",
  };
  return (
    <Chip
      size="small"
      color={colorMap[outcome] ?? "default"}
      variant="outlined"
      label={outcome}
      sx={{ borderRadius: 1.5 }}
    />
  );
}

function SessionCard({
  cls,
  locale,
  defaultSubject,
}: Readonly<{ cls: StudentClassRow; locale: string; defaultSubject: string }>) {
  const startDate = new Date(cls.scheduledStartAt);
  const now = new Date();
  const lockHours = 12;
  const locked = startDate.getTime() - now.getTime() < lockHours * 60 * 60 * 1000;

  return (
    <Card
      variant="outlined"
      sx={theme => ({
        borderColor: theme.palette.primary.light,
        borderWidth: 1.5,
        borderRadius: 1.5,
        transition: "box-shadow 0.2s",
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
        "&:hover": { boxShadow: 3, borderColor: theme.palette.primary.main },
      })}
    >
      <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 0.5 }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="caption"
              sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700, fontSize: "0.7rem" })}
            >
              {formatTime(startDate, locale)}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: "0.75rem",
              }}
            >
              {cls.subjectName ?? defaultSubject}
            </Typography>
            <Typography
              variant="caption"
              sx={theme => ({
                color: theme.palette.text.secondary,
                fontSize: "0.7rem",
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              })}
            >
              {cls.instructor}
            </Typography>
          </Box>
          <OutcomeChip outcome={cls.outcome} />
        </Stack>
        <Box sx={{ mt: 0.5 }}>
          <SessionActions classInstanceId={cls.id} locked={locked || startDate < now} compact />
        </Box>
      </CardContent>
    </Card>
  );
}

// Visible-but-subtle grid line color — derived from text.primary so it adapts
// to light/dark themes. Kept at module scope (no parent vars needed).
const gridLineColor = (theme: Theme) => alpha(theme.palette.text.primary, 0.08);

function WeekGrid({
  classes,
  weekStart,
  locale,
  defaultSubject,
}: Readonly<{ classes: readonly StudentClassRow[]; weekStart: Date; locale: string; defaultSubject: string }>) {
  const now = new Date();
  const dayFormatter = getDateTimeFormatter(getLatnLocaleTag(locale), WEEKDAY_SHORT_OPTIONS);

  // Group classes by local calendar day so each day column resolves its
  // sessions with a single map lookup instead of filtering the full list.
  const classesByDayKey = useMemo(() => {
    const map = new Map<string, StudentClassRow[]>();
    for (const cls of classes) {
      const parsed = new Date(cls.scheduledStartAt);
      if (Number.isNaN(parsed.getTime())) continue;
      const key = `${parsed.getFullYear()}-${parsed.getMonth()}-${parsed.getDate()}`;
      let list = map.get(key);
      if (!list) {
        list = [];
        map.set(key, list);
      }
      list.push(cls);
    }
    return map;
  }, [classes]);
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: 600 }}>
      <Box sx={theme => ({ display: "flex", borderBottom: `1px solid ${gridLineColor(theme)}` })}>
        <Box sx={{ minWidth: 60, p: 1 }} />
        {Array.from({ length: 7 }, (_, idx) => {
          const dayDate = addDays(weekStart, idx);
          const isToday = sameDay(dayDate, now);
          return (
            <Box
              key={dayDate.toISOString()}
              sx={theme => ({
                flex: 1,
                p: 1,
                textAlign: "center",
                borderLeft: `1px solid ${gridLineColor(theme)}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
              })}
            >
              <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary, fontWeight: 600 })}>
                {dayFormatter.format(dayDate)}
              </Typography>
              <Typography
                variant="h6"
                sx={theme => ({
                  fontWeight: 700,
                  bgcolor: isToday ? theme.palette.primary.main : "transparent",
                  color: isToday ? theme.palette.onPrimary : theme.palette.text.primary,
                  borderRadius: "50%",
                  width: 34,
                  height: 34,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.95rem",
                  transition: theme.transitions.create(["background-color", "color"], {
                    duration: theme.transitions.duration.short,
                  }),
                })}
              >
                {dayDate.getDate()}
              </Typography>
            </Box>
          );
        })}
      </Box>
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Box sx={{ minWidth: 60, display: "flex", flexDirection: "column" }}>
          {HOURS.map(hour => (
            <Box
              key={hour}
              sx={theme => ({
                height: 60,
                p: 0.5,
                textAlign: "right",
                borderBottom: `1px solid ${gridLineColor(theme)}`,
              })}
            >
              <Typography variant="caption" sx={theme => ({ color: theme.palette.text.disabled, fontSize: "0.7rem" })}>
                {formatHour(hour, locale)}
              </Typography>
            </Box>
          ))}
        </Box>
        {Array.from({ length: 7 }, (_, idx) => {
          const dayDate = addDays(weekStart, idx);
          const dayKey = `${dayDate.getFullYear()}-${dayDate.getMonth()}-${dayDate.getDate()}`;
          const dayClasses = classesByDayKey.get(dayKey) ?? [];
          return (
            <Box
              key={dayDate.toISOString()}
              sx={theme => ({
                flex: 1,
                borderLeft: `1px solid ${gridLineColor(theme)}`,
                position: "relative",
              })}
            >
              {HOURS.map(hour => (
                <Box
                  key={hour}
                  sx={theme => ({
                    height: 60,
                    borderBottom: `1px solid ${gridLineColor(theme)}`,
                  })}
                />
              ))}
              {dayClasses.map(cls => {
                const startDate = new Date(cls.scheduledStartAt);
                const startHour = startDate.getHours();
                const hourIndex = HOURS.indexOf(startHour);
                if (hourIndex === -1) return null;
                return (
                  <Box
                    key={cls.id}
                    sx={{ position: "absolute", top: hourIndex * 60 + 2, left: 2, right: 2, zIndex: 1 }}
                  >
                    <SessionCard cls={cls} locale={locale} defaultSubject={defaultSubject} />
                  </Box>
                );
              })}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export function StudentWeekCalendarContainer() {
  const [studentId] = useState("741f9933-8c5f-4507-acb8-fca09adcbe58");
  const { labels, locale, weekStart, goToPreviousWeek, goToNextWeek, goToToday, classes, loading, error } =
    useStudentWeekCalendarViewModel(studentId);

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.pageTitle} />
      <Stack direction="row" sx={{ alignItems: "center", mb: 2, gap: 1 }}>
        <IconButton onClick={goToPreviousWeek} aria-label={labels.previousWeek}>
          <ChevronLeftOutlined />
        </IconButton>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {getDateTimeFormatter(getLatnLocaleTag(locale), MONTH_DAY_OPTIONS).format(weekStart)} —{" "}
          {getDateTimeFormatter(getLatnLocaleTag(locale), MONTH_DAY_YEAR_OPTIONS).format(addDays(weekStart, 6))}
        </Typography>
        <IconButton onClick={goToNextWeek} aria-label={labels.nextWeek}>
          <ChevronRightOutlined />
        </IconButton>
        <Button
          variant="outlined"
          size="small"
          onClick={goToToday}
          sx={theme => ({
            borderRadius: 2,
            textTransform: "none",
            ml: 1,
            borderColor: theme.palette.primary.main,
            color: theme.palette.primary.main,
            "&:hover": {
              borderColor: theme.palette.primary.dark,
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
            },
          })}
        >
          {labels.today}
        </Button>
      </Stack>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {labels.failedToLoad}
        </Alert>
      ) : null}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Card variant="outlined">
          <CardContent sx={{ p: 0 }}>
            <WeekGrid classes={classes} weekStart={weekStart} locale={locale} defaultSubject={labels.defaultSubject} />
          </CardContent>
        </Card>
      )}
    </DesktopPageContainer>
  );
}
