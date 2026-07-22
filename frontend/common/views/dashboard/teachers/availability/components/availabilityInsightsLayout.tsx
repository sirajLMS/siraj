"use client";

import { Box } from "@mui/material";

import type { AvailabilityInsightsLayoutProps } from "@/frontend/common/views/dashboard/teachers/availability/components/types/availabilityInsightsShared.types";

export function AvailabilityInsightsLayout({
  layoutSx,
  peakLoadCard,
  availableStaffCard,
  timezoneInsightCard,
}: Readonly<AvailabilityInsightsLayoutProps>) {
  return (
    <Box sx={layoutSx}>
      {peakLoadCard}
      {availableStaffCard}
      {timezoneInsightCard}
    </Box>
  );
}
