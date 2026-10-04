"use client";

import { Box, Paper } from "@mui/material";
import type { WeeklyAvailabilityGridSharedProps } from "@/frontend/common/views/dashboard/teachers/availability/components/types/weeklyAvailabilityGridShared.types";
import { GridHeader } from "@/frontend/common/views/dashboard/teachers/availability/components/weeklyAvailabilityGridShared.header";
import { GridRow } from "@/frontend/common/views/dashboard/teachers/availability/components/weeklyAvailabilityGridShared.row";

export function WeeklyAvailabilityGridShared({
  availability,
  labels,
  onBlockClick,
  options,
}: Readonly<WeeklyAvailabilityGridSharedProps>) {
  return (
    <Paper
      elevation={0}
      sx={theme => ({
        borderRadius: theme.layout.radius.card,
        border: `1px solid ${theme.palette.border.main}`,
        overflow: "hidden",
      })}
    >
      <Box sx={{ overflowX: "auto", ...(options.momentumScroll ? { WebkitOverflowScrolling: "touch" } : {}) }}>
        <Box sx={{ minWidth: options.gridMinWidth }}>
          <GridHeader labels={labels} options={options} />
          <Box>
            {Object.entries(availability).map(([time, dayEntries]) => (
              <GridRow
                key={time}
                time={time}
                dayEntries={dayEntries}
                onBlockClick={onBlockClick}
                options={options}
                labels={labels}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
