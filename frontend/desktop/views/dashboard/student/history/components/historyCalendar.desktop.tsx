"use client";

import { ScheduleOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { computeCalendarGridLayout } from "@/frontend/common/views/dashboard/shared/calendarGridShared.utils";
import type { StudentHistorySessionRow } from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";

export interface StudentPortalHistoryCalendarProps {
  readonly currentMonth: Date;
  readonly sessionsByDay: Readonly<Partial<Record<number, StudentHistorySessionRow>>>;
  readonly selectedDay: number | null;
  readonly onSelectDay: (day: number | null) => void;
  readonly weekdayLabels: readonly string[];
}

function statusBadgeValue(status: string): string {
  const lower = status.toLowerCase();
  if (lower === "completed" || lower === "present" || lower === "taken") return "completed";
  if (lower === "cancelled" || lower === "absent") return "cancelled";
  if (lower === "pending" || lower === "scheduled") return "pending";
  if (lower === "late") return "late";
  return "pending";
}

export function StudentPortalHistoryCalendar({
  currentMonth,
  sessionsByDay,
  selectedDay,
  onSelectDay,
  weekdayLabels,
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

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
        {emptyStartDays.map(day => (
          <Box
            key={`prev-${day}`}
            sx={theme => ({
              minHeight: 88,
              p: 1.5,
              opacity: 0.35,
              borderRight: `1px solid ${theme.palette.outlineVariant}`,
              borderBottom: `1px solid ${theme.palette.outlineVariant}`,
              backgroundColor: theme.palette.surface,
            })}
          >
            <Typography variant="labelMd">{day}</Typography>
          </Box>
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const session = sessionsByDay[day];
          const isSelected = selectedDay === day;
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
                  <DesktopStatusBadge
                    category="classStatus"
                    status={statusBadgeValue(session.status)}
                    label={session.title}
                  />
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <ScheduleOutlined sx={theme => ({ fontSize: 12, color: theme.palette.onSurfaceVariant })} />
                    <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                      {session.time || "—"}
                    </Typography>
                  </Box>
                </Box>
              ) : null}
            </Box>
          );
        })}

        {emptyEndDays.map(day => (
          <Box
            key={`next-${day}`}
            sx={theme => ({
              minHeight: 88,
              p: 1.5,
              opacity: 0.35,
              borderRight: `1px solid ${theme.palette.outlineVariant}`,
              borderBottom: `1px solid ${theme.palette.outlineVariant}`,
              backgroundColor: theme.palette.surface,
            })}
          >
            <Typography variant="labelMd">{day}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
