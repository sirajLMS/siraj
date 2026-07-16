"use client";

import EmailOutlined from "@mui/icons-material/EmailOutlined";
import NotificationsActiveOutlined from "@mui/icons-material/NotificationsActiveOutlined";
import PhoneIphoneOutlined from "@mui/icons-material/PhoneIphoneOutlined";
import SmsOutlined from "@mui/icons-material/SmsOutlined";
import { Box, FormControlLabel, Skeleton, Slide, Stack, Switch, Tab, Tabs, Typography } from "@mui/material";
import { type SyntheticEvent, useRef, useState } from "react";
import {
  NotificationChannel,
  type NotificationChannel as NotificationChannelType,
  type NotificationEventType,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  buildPreferenceMap,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENT_TYPES,
  type NotificationPrefRow,
} from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes";
import { useAppTranslation } from "@/shared/locale/client";

type PreferencesChannelTabsProps = {
  readonly preferences: readonly NotificationPrefRow[];
  readonly onToggle: (channel: NotificationChannelType, eventType: NotificationEventType, enabled: boolean) => void;
  readonly disabled?: boolean;
  readonly loading?: boolean;
};

type ChannelId = (typeof NOTIFICATION_CHANNELS)[number];
type ChannelAccent = "primary" | "info" | "warning" | "secondary";

const CHANNEL_ICONS: Record<ChannelId, typeof EmailOutlined> = {
  [NotificationChannel.Email]: EmailOutlined,
  [NotificationChannel.Sms]: SmsOutlined,
  [NotificationChannel.Push]: NotificationsActiveOutlined,
  [NotificationChannel.OnApp]: PhoneIphoneOutlined,
};

const CHANNEL_ACCENTS: Record<ChannelId, ChannelAccent> = {
  [NotificationChannel.Email]: "primary",
  [NotificationChannel.Sms]: "info",
  [NotificationChannel.Push]: "warning",
  [NotificationChannel.OnApp]: "secondary",
};

function ChannelTabsSkeleton() {
  return (
    <Box
      sx={{
        mx: { xs: -2, md: 0 },
        width: { xs: "calc(100% + 32px)", md: "100%" },
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

export function PreferencesChannelTabs({
  preferences,
  onToggle,
  disabled = false,
  loading = false,
}: PreferencesChannelTabsProps) {
  const t = useAppTranslation().profileTranslations.notifications;
  const [activeChannel, setActiveChannel] = useState<ChannelId>(NOTIFICATION_CHANNELS[0]);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("left");
  const previousIndexRef = useRef(0);
  const preferenceMap = buildPreferenceMap(preferences);

  const handleChannelChange = (_: SyntheticEvent, value: ChannelId) => {
    const nextIndex = NOTIFICATION_CHANNELS.indexOf(value);
    setSlideDirection(nextIndex > previousIndexRef.current ? "left" : "right");
    previousIndexRef.current = nextIndex;
    setActiveChannel(value);
  };

  if (loading && preferences.length === 0) {
    return <ChannelTabsSkeleton />;
  }

  const activeAccent = CHANNEL_ACCENTS[activeChannel];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
        mx: { xs: -2, md: 0 },
        width: { xs: "calc(100% + 32px)", md: "100%" },
      }}
    >
      <Tabs
        value={activeChannel}
        onChange={handleChannelChange}
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
        {NOTIFICATION_CHANNELS.map(channel => {
          const Icon = CHANNEL_ICONS[channel];
          const accent = CHANNEL_ACCENTS[channel];
          const isActive = activeChannel === channel;
          return (
            <Tab
              key={channel}
              value={channel}
              icon={<Icon fontSize="small" />}
              iconPosition="start"
              label={t.channels[channel]}
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

      <Box sx={{ overflow: "hidden" }}>
        <Slide key={activeChannel} direction={slideDirection} in appear mountOnEnter unmountOnExit timeout={220}>
          <Stack spacing={0}>
            {NOTIFICATION_EVENT_TYPES.map((eventType, index) => {
              const pref = preferenceMap.get(`${activeChannel}:${eventType}`);
              const enabled = pref?.enabled ?? true;

              return (
                <FormControlLabel
                  key={`${activeChannel}-${eventType}`}
                  control={
                    <Switch
                      color={activeAccent}
                      checked={enabled}
                      disabled={disabled}
                      onChange={(_, checked) => {
                        onToggle(activeChannel, eventType, checked);
                      }}
                    />
                  }
                  label={<Typography sx={{ typography: "bodyMd" }}>{t.events[eventType]}</Typography>}
                  labelPlacement="start"
                  sx={theme => ({
                    mx: 0,
                    px: 2,
                    py: 1.75,
                    width: "100%",
                    justifyContent: "space-between",
                    backgroundColor: index % 2 === 1 ? theme.palette.action.hover : "transparent",
                  })}
                />
              );
            })}
          </Stack>
        </Slide>
      </Box>
    </Box>
  );
}
