"use client";

import { Box, Typography } from "@mui/material";
import type { AvailabilityInsightsSharedOptions } from "@/frontend/common/views/dashboard/teachers/availability/components/__shared__/availabilityInsightsShared.types";
import type { InsightCardProps } from "@/frontend/common/views/dashboard/teachers/availability/types";

function InsightCard({
  title,
  value,
  description,
  icon,
  options,
}: Readonly<InsightCardProps & { options: AvailabilityInsightsSharedOptions }>) {
  return (
    <options.CardComponent
      sx={theme => ({
        p: theme.layout.cardPadding,
        display: "flex",
        flexDirection: "column",
        ...(options.cardFlex !== undefined ? { flex: options.cardFlex } : {}),
        minHeight: options.cardMinHeight,
      })}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: options.insightTitleMarginBottom,
        }}
      >
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
          {title}
        </Typography>
        {icon}
      </Box>
      <Box sx={{ mt: "auto" }}>
        <Typography variant={options.valueVariant} sx={theme => ({ color: theme.palette.primary.main, mb: 0.5 })}>
          {value}
        </Typography>
        <Typography variant={options.descriptionVariant} sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {description}
        </Typography>
      </Box>
    </options.CardComponent>
  );
}

export { InsightCard };
