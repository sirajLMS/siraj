"use client";

import { ScheduleOutlined } from "@mui/icons-material";
import type { SxProps, Theme } from "@mui/material";
import { Box, Typography } from "@mui/material";
import { formatTime } from "@/frontend/common/components/intl/dateFormat";
import { classHref } from "@/frontend/common/utils/profileHref";
import { computeCalendarGridLayout } from "@/frontend/common/views/dashboard/shared/calendarGridShared.utils";
import type { StudentHistorySessionRow } from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";
import type { StudentHistoryViewModel } from "@/frontend/common/views/dashboard/student/history/useStudentHistoryViewModel";
import {
  mapStudentHistoryStatusToBadge,
  resolveStudentHistoryStatusLabel,
} from "@/frontend/common/views/dashboard/student/history/utils/studentHistorySessionPresentation";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { Link } from "@/shared/i18n";

export interface StudentPortalHistoryCalendarProps {
  readonly currentMonth: Date;
  readonly sessionsByDay: Readonly<Partial<Record<number, StudentHistorySessionRow>>>;
  readonly selectedDay: number | null;
  readonly onSelectDay: (day: number | null) => void;
  readonly weekdayLabels: readonly string[];
  readonly labels: StudentHistoryViewModel["labels"];
  readonly locale: string;
}

const SPILLOVER_CELL_SX: SxProps<Theme> = (theme: Theme) => ({
  minHeight: 88,
  p: 1.5,
  opacity: 0.35,
  borderRight: `1px solid ${theme.palette.outlineVariant}`,
  borderBottom: `1px solid ${theme.palette.outlineVariant}`,
  backgroundColor: theme.palette.surface,
});

function renderWeekdayHeader(weekdayLabels: readonly string[]) {
  return (
    <Box
      sx={theme => ({
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        borderBottom: `1px solid ${theme.palette.outlineVariant}`,
        backgroundColor: theme.palette.surfaceContainer,
      })}
    >
      {weekdayLabels.map(label => (
        <Box key={label} sx={{ p: 1, textAlign: "center" }}>
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant, fontWeight: 700 })}>
            {label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function renderSpilloverDay(day: number, keyPrefix: string) {
  return (
    <Box key={`${keyPrefix}-${day}`} sx={SPILLOVER_CELL_SX}>
      <Typography variant="labelMd">{day}</Typography>
    </Box>
  );
}

function formatSessionTime(time: string, locale: string): string {
  if (!time) return "—";
  try {
    return formatTime(time, locale);
  } catch {
    return time;
  }
}

function renderDayCell(
  day: number,
  session: StudentHistorySessionRow | undefined,
  isSelected: boolean,
  onSelectDay: (day: number | null) => void,
  labels: StudentHistoryViewModel["labels"],
  locale: string
) {
  const statusLabel = session ? resolveStudentHistoryStatusLabel(session, labels.statusLabels) : "";
  const badgeStatus = session ? mapStudentHistoryStatusToBadge(session.status, session.outcome) : "pending";

  return (
    <Box
      key={`day-${day}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelectDay(isSelected ? null : day)}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectDay(isSelected ? null : day);
        }
      }}
      sx={theme => ({
        minHeight: 88,
        p: 1.5,
        cursor: "pointer",
        borderRight: `1px solid ${theme.palette.outlineVariant}`,
        borderBottom: `1px solid ${theme.palette.outlineVariant}`,
        backgroundColor: isSelected ? theme.palette.primaryContainer : theme.palette.surfaceContainerLowest,
        transition: "background-color 0.15s ease",
        "&:hover": {
          boxShadow: `inset 0 0 0 2px ${theme.palette.primary.main}`,
        },
      })}
    >
      <Typography
        variant="labelMd"
        sx={theme => ({
          color: isSelected ? theme.palette.onPrimaryContainer : theme.palette.onSurfaceVariant,
          fontWeight: isSelected ? 700 : 500,
        })}
      >
        {day}
      </Typography>
      {session ? (
        <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography
            component={Link}
            href={classHref(session.id)}
            variant="labelMd"
            onClick={e => e.stopPropagation()}
            sx={theme => ({
              color: theme.palette.primary.main,
              fontWeight: 700,
              textDecoration: "none",
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              "&:hover": { textDecoration: "underline" },
            })}
          >
            {session.title}
          </Typography>
          <DesktopStatusBadge category="classStatus" status={badgeStatus} label={statusLabel} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <ScheduleOutlined sx={theme => ({ fontSize: 12, color: theme.palette.onSurfaceVariant })} />
            <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {formatSessionTime(session.time, locale)}
            </Typography>
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}

export function StudentPortalHistoryCalendar({
  currentMonth,
  sessionsByDay,
  selectedDay,
  onSelectDay,
  weekdayLabels,
  labels,
  locale,
}: Readonly<StudentPortalHistoryCalendarProps>) {
  const { daysInMonth, emptyStartDays, emptyEndDays } = computeCalendarGridLayout(currentMonth);

  return (
    <Box
      sx={theme => ({
        borderRadius: 2,
        border: `1px solid ${theme.palette.outlineVariant}`,
        overflow: "hidden",
        backgroundColor: theme.palette.surfaceContainerLowest,
      })}
    >
      {renderWeekdayHeader(weekdayLabels)}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
        {emptyStartDays.map(day => renderSpilloverDay(day, "prev"))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day =>
          renderDayCell(day, sessionsByDay[day], selectedDay === day, onSelectDay, labels, locale)
        )}
        {emptyEndDays.map(day => renderSpilloverDay(day, "next"))}
      </Box>
    </Box>
  );
}
