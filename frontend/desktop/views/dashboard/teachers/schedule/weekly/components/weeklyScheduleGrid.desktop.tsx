"use client";

import { Box } from "@mui/material";
import { WEEKLY_SCHEDULE_TIMES } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks";
import type { WeeklyScheduleGridProps } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import { GRID_COLUMNS } from "@/frontend/desktop/views/dashboard/teachers/schedule/weekly/components/weeklyScheduleGrid.desktop.constants";
import { GridHeader } from "@/frontend/desktop/views/dashboard/teachers/schedule/weekly/components/weeklyScheduleGrid.desktop.header";
import { GridRow } from "@/frontend/desktop/views/dashboard/teachers/schedule/weekly/components/weeklyScheduleGrid.desktop.row";

export default function WeeklyScheduleGrid({
  classes,
  onRemoveClass,
  hasScheduleDeleteClass,
  labels,
  meetingJoinLabels,
}: Readonly<WeeklyScheduleGridProps>) {
  return (
    <Box
      sx={theme => ({
        display: "grid",
        gridTemplateColumns: GRID_COLUMNS,
        border: `1px solid ${theme.palette.border.light}`,
        borderRadius: theme.layout.radius.card,
        overflow: "hidden",
        backgroundColor: theme.palette.background.paper,
        width: "100%",
      })}
    >
      <GridHeader labels={labels} />
      {WEEKLY_SCHEDULE_TIMES.map(time => (
        <GridRow
          key={time}
          time={time}
          classes={classes}
          onRemoveClass={onRemoveClass}
          hasScheduleDeleteClass={hasScheduleDeleteClass}
          labels={labels}
          meetingJoinLabels={meetingJoinLabels}
        />
      ))}
    </Box>
  );
}
