"use client";

import { alpha, Box, Typography } from "@mui/material";
import type { DayOfWeek } from "@/frontend/common/graphql/generated/gql/graphql";
import type { WeeklyAvailabilityGridSharedOptions } from "@/frontend/common/views/dashboard/teachers/availability/components/types/weeklyAvailabilityGridShared.types";
import {
  DAY_LABEL_KEYS,
  DAYS,
} from "@/frontend/common/views/dashboard/teachers/availability/components/weeklyAvailabilityGridShared.constants";
import type { WeeklyAvailabilityGridLabels } from "@/frontend/common/views/dashboard/teachers/availability/types";

function GridHeader({
  labels,
  options,
}: Readonly<{ labels: WeeklyAvailabilityGridLabels; options: WeeklyAvailabilityGridSharedOptions }>) {
  return (
    <Box
      sx={theme => ({
        display: "grid",
        gridTemplateColumns: options.gridTemplateColumns,
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.onPrimary,
      })}
    >
      <Box
        sx={theme => ({
          p: options.headerPadding,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRight: `1px solid ${alpha(theme.palette.onPrimary, 0.1)}`,
        })}
      >
        <Typography variant={options.headerLabelVariant} sx={{ color: "inherit" }}>
          {labels.time}
        </Typography>
      </Box>
      {DAYS.map((day: DayOfWeek, index) => (
        <Box
          key={day}
          sx={theme => ({
            p: options.headerPadding,
            textAlign: "center",
            borderRight: index < DAYS.length - 1 ? `1px solid ${alpha(theme.palette.onPrimary, 0.1)}` : "none",
          })}
        >
          <Typography variant={options.headerLabelVariant} sx={{ color: "inherit" }}>
            {labels[DAY_LABEL_KEYS[day]]}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export { GridHeader };
