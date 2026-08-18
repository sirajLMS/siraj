"use client";

import { ScheduleOutlined } from "@mui/icons-material";
import { Box, styled, Typography } from "@mui/material";
import { AttendanceStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  CalendarGridContainer,
  CalendarWeekdayHeader,
} from "@/frontend/common/views/dashboard/shared/CalendarGridShared";
import { computeCalendarGridLayout } from "@/frontend/common/views/dashboard/shared/calendarGridShared.utils";
import type { CalendarGridProps, ClassSession } from "@/frontend/common/views/dashboard/students/history/types";
import { useStudentHistoryLabels } from "@/frontend/common/views/dashboard/students/history/useStudentHistoryLabels";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { Link } from "@/shared/i18n";

const calendarCellBase = ({ theme }: { theme: import("@mui/material/styles").Theme }) => ({
  borderRight: `1px solid ${theme.palette.border.light}`,
  borderBottom: `1px solid ${theme.palette.border.light}`,
  padding: theme.spacing(1.5),
  transition: theme.transitions.create("all", { duration: 200, easing: theme.transitions.easing.easeInOut }),
  backgroundColor: theme.palette.background.paper,
  position: "relative" as const,
});

const CalendarCell = styled(Box)(({ theme }) => ({
  ...calendarCellBase({ theme }),
  cursor: "default",
}));

const CalendarCellLink = styled(Link)(({ theme }) => ({
  ...calendarCellBase({ theme }),
  display: "block",
  textDecoration: "none",
  color: "inherit",
  cursor: "pointer",
  "&:hover": {
    boxShadow: `inset 0 0 0 2px ${theme.palette.primary.main}`,
  },
}));

const EmptyCell = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  borderRight: `1px solid ${theme.palette.border.light}`,
  borderBottom: `1px solid ${theme.palette.border.light}`,
  padding: theme.spacing(1.5),
  opacity: 0.3,
}));

function CalendarStatusBadge({ status, label }: Readonly<{ status: AttendanceStatus; label: string }>) {
  let badgeStatus: string;
  if (status === AttendanceStatus.Present) {
    badgeStatus = "active";
  } else if (status === AttendanceStatus.Late) {
    badgeStatus = "late";
  } else if (status === AttendanceStatus.Absent) {
    badgeStatus = "blocked";
  } else {
    badgeStatus = "pending";
  }
  return <DesktopStatusBadge category="classSession" status={badgeStatus} label={label} />;
}

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

function isWeekdayKey(value: string): value is WeekdayKey {
  return (WEEKDAY_KEYS as readonly string[]).includes(value);
}

function CalendarDayCell({ day, session }: Readonly<{ day: number; session?: ClassSession }>) {
  const content = (
    <>
      <Typography
        variant="labelMd"
        sx={theme => ({
          color: theme.palette.onSurfaceVariant,
          transition: theme.transitions.create("colors", { duration: 200 }),
          ...(session && { "&:hover": { color: theme.palette.primary.main } }),
        })}
      >
        {day}
      </Typography>

      {session && (
        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
          <CalendarStatusBadge status={session.status} label={session.title} />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              color: theme => theme.palette.onSurfaceVariant,
            }}
          >
            <ScheduleOutlined sx={{ fontSize: 10 }} />
            <Typography sx={{ typography: "labelSm" }}>{session.timeSlot}</Typography>
          </Box>
          {session.instructor ? (
            <Typography
              sx={theme => ({
                typography: "labelSm",
                color: theme.palette.onSurfaceVariant,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              })}
            >
              {session.instructor}
            </Typography>
          ) : null}
        </Box>
      )}
    </>
  );

  if (session) {
    return <CalendarCellLink href={`/classes/${session.id}`}>{content}</CalendarCellLink>;
  }

  return <CalendarCell>{content}</CalendarCell>;
}

export function CalendarGridDesktop({ currentMonth, classes }: Readonly<CalendarGridProps>) {
  const t = useStudentHistoryLabels();
  const { daysInMonth, emptyStartDays, emptyEndDays } = computeCalendarGridLayout(currentMonth);

  return (
    <CalendarGridContainer>
      <CalendarWeekdayHeader translateDay={day => t.calendar.days[isWeekdayKey(day) ? day : "sun"]} />

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", minHeight: 800 }}>
        {emptyStartDays.map(day => (
          <EmptyCell key={`start-${day}`}>
            <Typography variant="labelMd">{day}</Typography>
          </EmptyCell>
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
          <CalendarDayCell key={day} day={day} session={classes[day]} />
        ))}

        {emptyEndDays.map(day => (
          <EmptyCell key={`end-${day}`}>
            <Typography variant="labelMd">{day}</Typography>
          </EmptyCell>
        ))}
      </Box>
    </CalendarGridContainer>
  );
}
