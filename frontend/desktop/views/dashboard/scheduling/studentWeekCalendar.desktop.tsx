"use client";

import { useQuery } from "@apollo/client/react";
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
import { useState } from "react";
import { studentClassesRangeQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { SessionActions } from "@/frontend/common/views/dashboard/scheduling/session-actions/SessionActions";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

interface StudentClassRow {
  id: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  subjectName: string | null;
  instructor: string;
  outcome: string;
  executionState: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7);

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatHour(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = ((hour + 11) % 12) + 1;
  return `${displayHour}:00 ${period}`;
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

function SessionCard({ cls }: Readonly<{ cls: StudentClassRow }>) {
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
              {startDate.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
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
              {cls.subjectName ?? "Session"}
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

function WeekGrid({ classes, weekStart }: Readonly<{ classes: StudentClassRow[]; weekStart: Date }>) {
  const now = new Date();
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: 600 }}>
      <Box sx={theme => ({ display: "flex", borderBottom: `1px solid ${gridLineColor(theme)}` })}>
        <Box sx={{ minWidth: 60, p: 1 }} />
        {DAYS.map((day, idx) => {
          const dayDate = addDays(weekStart, idx);
          const isToday = sameDay(dayDate, now);
          return (
            <Box
              key={day}
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
                {day}
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
                {formatHour(hour)}
              </Typography>
            </Box>
          ))}
        </Box>
        {DAYS.map((day, idx) => {
          const dayDate = addDays(weekStart, idx);
          const dayClasses = classes.filter(c => sameDay(new Date(c.scheduledStartAt), dayDate));
          return (
            <Box
              key={day}
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
                    <SessionCard cls={cls} />
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
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [studentId] = useState("741f9933-8c5f-4507-acb8-fca09adcbe58");

  const weekEnd = addDays(weekStart, 7);
  const { data, loading, error } = useQuery(studentClassesRangeQueryDocument, {
    variables: { studentId, from: weekStart.toISOString(), to: weekEnd.toISOString() },
    fetchPolicy: "cache-and-network",
  });

  const classes: StudentClassRow[] = (data?.studentUpcomingClasses?.classes ?? []).map(cls => ({
    id: cls.id ?? "",
    scheduledStartAt: cls.scheduledStartAt ?? "",
    scheduledEndAt: cls.scheduledEndAt ?? "",
    subjectName: cls.subjectName ?? null,
    instructor: cls.instructor ?? "",
    outcome: cls.outcome ?? "",
    executionState: cls.executionState ?? "",
  }));

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title="Weekly Schedule" />
      <Stack direction="row" sx={{ alignItems: "center", mb: 2, gap: 1 }}>
        <IconButton onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week">
          <ChevronLeftOutlined />
        </IconButton>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {weekStart.toLocaleDateString("en", { month: "long", day: "numeric" })} —{" "}
          {addDays(weekStart, 6).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}
        </Typography>
        <IconButton onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Next week">
          <ChevronRightOutlined />
        </IconButton>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setWeekStart(startOfWeek(new Date()))}
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
          Today
        </Button>
      </Stack>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load schedule.
        </Alert>
      ) : null}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Card variant="outlined">
          <CardContent sx={{ p: 0 }}>
            <WeekGrid classes={classes} weekStart={weekStart} />
          </CardContent>
        </Card>
      )}
    </DesktopPageContainer>
  );
}
