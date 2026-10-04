"use client";

import { PublicOutlined } from "@mui/icons-material";
import { AvatarGroup, Box, Tooltip, Typography } from "@mui/material";
import { toIanaTimezoneOrNull } from "@/frontend/common/lib/timezone";
import type { AvailabilityInsightsSharedOptions } from "@/frontend/common/views/dashboard/teachers/availability/components/__shared__/availabilityInsightsShared.types";

function TimezoneInsight({
  timezones,
  labels,
  options,
}: Readonly<{
  timezones: readonly string[];
  labels: { title: string; description: string };
  options: AvailabilityInsightsSharedOptions;
}>) {
  return (
    <options.CardComponent
      sx={theme => ({
        p: theme.layout.cardPadding,
        display: "flex",
        flexDirection: "column",
        ...(options.cardFlex !== undefined ? { flex: options.cardFlex } : {}),
        minHeight: options.cardMinHeight,
        position: "relative",
        overflow: "hidden",
      })}
    >
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Typography
          variant="titleLg"
          sx={theme => ({ mb: options.timezoneTitleMarginBottom, color: theme.palette.primary.main })}
        >
          {labels.title}
        </Typography>
        <Typography variant={options.descriptionVariant} sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {labels.description}
        </Typography>
      </Box>

      <AvatarGroup
        max={4}
        sx={theme => ({
          mt: options.avatarGroupMarginTop,
          justifyContent: "flex-end",
          flexDirection: "row-reverse",
          position: "relative",
          zIndex: 1,
          "& .MuiAvatar-root": {
            width: options.avatarSize,
            height: options.avatarSize,
            fontSize: theme.typography.labelSm.fontSize,
            fontWeight: 700,
            border: `2px solid ${theme.palette.background.paper}`,
            backgroundColor: theme.palette.secondaryContainer,
            color: theme.palette.onSecondaryContainer,
          },
        })}
      >
        {timezones.map((tz, index) => (
          <Tooltip
            key={tz}
            title={<options.TimezoneDisplayComponent timezone={toIanaTimezoneOrNull(tz)} />}
            arrow
            describeChild
          >
            <options.AvatarComponent
              size={options.avatarSize}
              sx={theme => ({
                backgroundColor: index === 0 ? theme.palette.primaryContainer : theme.palette.secondaryContainer,
                color: index === 0 ? theme.palette.onPrimaryContainer : theme.palette.onSecondaryContainer,
              })}
            >
              {tz}
            </options.AvatarComponent>
          </Tooltip>
        ))}
      </AvatarGroup>

      <Box
        sx={{
          position: "absolute",
          right: -options.iconOffset,
          bottom: -options.iconOffset,
          opacity: 0.1,
          pointerEvents: "none",
        }}
      >
        <PublicOutlined sx={theme => ({ fontSize: options.iconFontSize, color: theme.palette.primary.main })} />
      </Box>
    </options.CardComponent>
  );
}

export { TimezoneInsight };
