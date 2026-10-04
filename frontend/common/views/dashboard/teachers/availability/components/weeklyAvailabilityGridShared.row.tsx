"use client";

import { Box, Typography } from "@mui/material";
import type { WeeklyAvailabilityGridSharedOptions } from "@/frontend/common/views/dashboard/teachers/availability/components/types/weeklyAvailabilityGridShared.types";
import { AvailabilityBlock } from "@/frontend/common/views/dashboard/teachers/availability/components/weeklyAvailabilityGridShared.block";
import { DAYS } from "@/frontend/common/views/dashboard/teachers/availability/components/weeklyAvailabilityGridShared.constants";
import type {
  AvailabilityEntry,
  WeeklyAvailabilityGridLabels,
  WeeklyAvailabilityGridProps,
} from "@/frontend/common/views/dashboard/teachers/availability/types";

function GridRow({
  time,
  dayEntries,
  onBlockClick,
  options,
  labels,
}: Readonly<{
  time: string;
  dayEntries: WeeklyAvailabilityGridProps["availability"][string];
  onBlockClick?: (entry: AvailabilityEntry) => void;
  options: WeeklyAvailabilityGridSharedOptions;
  labels: WeeklyAvailabilityGridLabels;
}>) {
  return (
    <Box
      sx={theme => ({
        display: "grid",
        gridTemplateColumns: options.gridTemplateColumns,
        minHeight: options.rowMinHeight,
        borderBottom: `1px solid ${theme.palette.border.main}`,
        "&:last-child": { borderBottom: "none" },
      })}
    >
      <Box
        sx={theme => ({
          backgroundColor: theme.palette.surfaceContainerLow,
          color: theme.palette.onSurface,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRight: `1px solid ${theme.palette.border.main}`,
        })}
      >
        <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {time}
        </Typography>
      </Box>
      {DAYS.map((day, index) => {
        const entries = dayEntries?.[day];
        return (
          <Box
            key={`${time}-${day}`}
            sx={theme => ({
              p: options.cellPadding,
              borderRight: index < DAYS.length - 1 ? `1px solid ${theme.palette.border.main}` : "none",
              position: "relative",
            })}
          >
            {entries?.map(entry => (
              <AvailabilityBlock
                key={entry.id}
                entry={entry}
                onClick={onBlockClick ? () => onBlockClick(entry) : undefined}
                padding={options.blockPadding}
                labels={labels}
              />
            ))}
          </Box>
        );
      })}
    </Box>
  );
}

export { GridRow };
