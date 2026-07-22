"use client";

import { Box, FormControlLabel, Skeleton, Slide, Stack, Switch, Tab, Tabs, Typography } from "@mui/material";
import type { SyntheticEvent } from "react";
import type {
  NotificationChannel as NotificationChannelType,
  NotificationEventType,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  NOTIFICATION_CHANNEL_ACCENTS,
  NOTIFICATION_CHANNEL_ICONS,
  type NotificationChannelAccent,
} from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferencesConstants";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENT_TYPES,
  type NotificationPrefRow,
} from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes";
import { useAppTranslation } from "@/shared/locale";

type ChannelId = (typeof NOTIFICATION_CHANNELS)[number];

interface PreferencesChannelTabsMobileViewProps {
  readonly preferences: readonly NotificationPrefRow[];
  // NEW FOR PLAN v5: pre-computed preference lookup map passed from the
  // container so the tier view stays render-only (no `buildPreferenceMap`
  // invocation, no `useMemo` derivation in tier — specs.md §6.1).
  readonly preferenceMap: ReadonlyMap<string, NotificationPrefRow>;
  /** Role-filtered event catalog; defaults to full matrix when omitted. */
  readonly eventTypes?: readonly NotificationEventType[];
  readonly onToggle: (channel: NotificationChannelType, eventType: NotificationEventType, enabled: boolean) => void;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly activeChannel: NotificationChannelType;
  readonly slideDirection: "left" | "right";
  readonly onChannelChange: (channel: NotificationChannelType, slideDirection: "left" | "right") => void;
}

function ChannelTabsSkeleton() {
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

export function PreferencesChannelTabsMobileView({
  preferences,
  preferenceMap,
  eventTypes = NOTIFICATION_EVENT_TYPES,
  onToggle,
  disabled = false,
  loading = false,
  activeChannel,
  slideDirection,
  onChannelChange,
}: Readonly<PreferencesChannelTabsMobileViewProps>) {
  const t = useAppTranslation().profileTranslations.notifications;
  const eventLabels = t.events as Record<string, string>;
  const getEventLabel = (eventType: NotificationEventType): string => eventLabels[eventType] ?? eventType;

  const handleChannelChange = (_: SyntheticEvent, value: ChannelId) => {
    const nextIndex = NOTIFICATION_CHANNELS.indexOf(value);
    const prevIndex = NOTIFICATION_CHANNELS.indexOf(activeChannel);
    const direction: "left" | "right" = nextIndex > prevIndex ? "left" : "right";
    onChannelChange(value, direction);
  };

  if (loading && preferences.length === 0) {
    return <ChannelTabsSkeleton />;
  }

  const activeAccent: NotificationChannelAccent = NOTIFICATION_CHANNEL_ACCENTS[activeChannel];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
        mx: -2,
        width: "calc(100% + 32px)",
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
          const Icon = NOTIFICATION_CHANNEL_ICONS[channel];
          const accent = NOTIFICATION_CHANNEL_ACCENTS[channel];
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
            {eventTypes.map((eventType, index) => {
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
                  label={<Typography sx={{ typography: "bodyMd" }}>{getEventLabel(eventType)}</Typography>}
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
