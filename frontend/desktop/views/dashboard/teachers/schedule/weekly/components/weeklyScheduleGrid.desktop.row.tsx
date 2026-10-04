"use client";

import { Box, Typography } from "@mui/material";
import { WEEKLY_SCHEDULE_DAYS } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks";
import type { ScheduledClass } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import { GRID_COLUMNS } from "@/frontend/desktop/views/dashboard/teachers/schedule/weekly/components/weeklyScheduleGrid.desktop.constants";
import { SlotItem } from "@/frontend/desktop/views/dashboard/teachers/schedule/weekly/components/weeklyScheduleGrid.desktop.slotItem";
import type { TeacherWeeklyScheduleLabels } from "@/shared/locale/types/dashboard/teachers/weeklySchedule";
import type { MeetingConfigJoinLabels } from "@/shared/locale/types/ui";

interface GridRowProps {
  readonly time: string;
  readonly classes: readonly ScheduledClass[];
  readonly onRemoveClass: (id: string) => void;
  readonly hasScheduleDeleteClass: boolean;
  readonly labels: TeacherWeeklyScheduleLabels;
  readonly meetingJoinLabels: MeetingConfigJoinLabels;
}

export function GridRow({
  time,
  classes,
  onRemoveClass,
  hasScheduleDeleteClass,
  labels,
  meetingJoinLabels,
}: Readonly<GridRowProps>) {
  const t = labels;
  const getClassesForSlot = (day: string) => {
    return classes.filter(c => c.day?.toLowerCase() === day && c.startTime === time);
  };

  return (
    <Box
      sx={theme => ({
        gridColumn: "1 / -1",
        display: "grid",
        gridTemplateColumns: GRID_COLUMNS,
        borderTop: `1px solid ${theme.palette.border.light}`,
        minHeight: 68,
      })}
    >
      <Box
        sx={theme => ({
          px: 1,
          py: 1,
          backgroundColor: theme.palette.surfaceContainerLow,
          borderRight: `1px solid ${theme.palette.border.light}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary, fontWeight: 600 })}>
          {time}
        </Typography>
      </Box>

      {WEEKLY_SCHEDULE_DAYS.map(day => {
        const slotClasses = getClassesForSlot(day);
        const isLunch = time === "12:00 PM";

        return (
          <Box
            key={day}
            sx={theme => ({
              p: 0.5,
              borderRight: `1px solid ${theme.palette.border.light}`,
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              minHeight: 88,
              backgroundColor: isLunch ? theme.palette.action.hover : theme.palette.background.default,
              "&:last-child": { borderRight: "none" },
            })}
          >
            {isLunch ? (
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.5,
                }}
              >
                <Typography variant="caption" sx={{ fontStyle: "italic" }}>
                  {t.grid.lunchBreak}
                </Typography>
              </Box>
            ) : (
              slotClasses.map(c => (
                <SlotItem
                  key={c.id}
                  classItem={c}
                  onRemove={onRemoveClass}
                  hasScheduleDeleteClass={hasScheduleDeleteClass}
                  labels={labels}
                  meetingJoinLabels={meetingJoinLabels}
                />
              ))
            )}
          </Box>
        );
      })}
    </Box>
  );
}
