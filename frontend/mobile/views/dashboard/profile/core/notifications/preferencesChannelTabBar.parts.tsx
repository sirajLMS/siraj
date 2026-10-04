"use client";

import { Box, Skeleton, Stack, Tab, Tabs } from "@mui/material";
import type { SyntheticEvent } from "react";
import type { NotificationChannel } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  NOTIFICATION_CHANNEL_ACCENTS,
  NOTIFICATION_CHANNEL_ICONS,
  type NotificationChannelAccent,
} from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferencesConstants";
import { CHANNEL_ORDER } from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceUtils";

export function ChannelTabsSkeleton() {
  return (
    <Box
      sx={{
        mx: -2,
        width: "calc(100% + 32px)",
      }}
    >
      <Skeleton variant="rectangular" height={48} sx={{ mb: 0 }} />
      <Stack spacing={0}>
        {["row-a", "row-b", "row-c"].map(id => (
          <Skeleton key={id} variant="rectangular" height={56} />
        ))}
      </Stack>
    </Box>
  );
}

interface ChannelTabBarProps {
  readonly activeChannel: NotificationChannel;
  readonly activeAccent: NotificationChannelAccent;
  readonly channelLabels: Record<string, string>;
  readonly onChange: (event: SyntheticEvent, value: NotificationChannel) => void;
}

export function ChannelTabBar({ activeChannel, activeAccent, channelLabels, onChange }: Readonly<ChannelTabBarProps>) {
  return (
    <Tabs
      value={activeChannel}
      onChange={onChange}
      variant="scrollable"
      scrollButtons={false}
      sx={theme => ({
        borderBottom: `1px solid ${theme.palette.divider}`,
        minHeight: 48,
        px: 2,
        "& .MuiTabs-indicator": {
          backgroundColor: theme.palette[activeAccent].main,
        },
        "& .MuiTab-root": {
          minHeight: 48,
          typography: "bodyMd",
          textTransform: "none",
          gap: 0.75,
        },
      })}
    >
      {CHANNEL_ORDER.map(channel => {
        const Icon = NOTIFICATION_CHANNEL_ICONS[channel];
        const accent = NOTIFICATION_CHANNEL_ACCENTS[channel];
        const isActive = activeChannel === channel;
        return (
          <Tab
            key={channel}
            value={channel}
            icon={<Icon fontSize="small" />}
            iconPosition="start"
            label={channelLabels[channel]}
            sx={theme => ({
              color: isActive ? theme.palette[accent].main : theme.palette[accent].light,
              opacity: isActive ? 1 : 0.7,
              "&.Mui-selected": {
                color: theme.palette[accent].main,
              },
            })}
          />
        );
      })}
    </Tabs>
  );
}
