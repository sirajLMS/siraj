"use client";

import { Box, Typography } from "@mui/material";
import { WEEKLY_SCHEDULE_DAYS } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks";
import { GRID_COLUMNS } from "@/frontend/desktop/views/dashboard/teachers/schedule/weekly/components/weeklyScheduleGrid.desktop.constants";
import type { TeacherWeeklyScheduleLabels } from "@/shared/locale/types/dashboard/teachers/weeklySchedule";

export function GridHeader({ labels }: Readonly<{ labels: TeacherWeeklyScheduleLabels }>) {
  const t = labels;
  return (
    <Box
      sx={theme => ({
        gridColumn: "1 / -1",
        display: "grid",
        gridTemplateColumns: GRID_COLUMNS,
        backgroundColor: theme.palette.sidebar,
        color: theme.palette.onSidebar,
      })}
    >
      <Box
        sx={theme => ({
          px: 1,
          py: 1.5,
          borderRight: `1px solid ${theme.palette.outlineVariant}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <Typography variant="labelUppercase" sx={{ fontSize: 10, textAlign: "center", lineHeight: 1.3 }}>
          {t.grid.teacherTime}
        </Typography>
      </Box>
      {WEEKLY_SCHEDULE_DAYS.map(day => (
        <Box
          key={day}
          sx={theme => ({
            px: 1,
            py: 1.5,
            borderRight: `1px solid ${theme.palette.outlineVariant}`,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "&:last-child": { borderRight: "none" },
          })}
        >
          <Typography variant="labelMd" sx={{ color: "inherit", fontWeight: 600 }}>
            {t.days[day]}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
