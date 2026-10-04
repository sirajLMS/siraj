"use client";

import { Box } from "@mui/material";
import type { SyntheticEvent } from "react";
import type { NotificationChannel, NotificationEventType } from "@/frontend/common/graphql/generated/gql/graphql";
import { NOTIFICATION_CHANNEL_ACCENTS } from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferencesConstants";
import {
  type CategoryRow,
  NOTIFICATION_EVENT_TYPES,
  type NotificationEventCategory,
  type NotificationPrefRow,
} from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes";
import { CHANNEL_ORDER } from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceUtils";
import { PreferenceList } from "@/frontend/mobile/views/dashboard/profile/core/notifications/preferencesChannelPreferenceList.parts";
import {
  ChannelTabBar,
  ChannelTabsSkeleton,
} from "@/frontend/mobile/views/dashboard/profile/core/notifications/preferencesChannelTabBar.parts";
import type { ProfileNotificationsLabels } from "@/shared/locale/types/profile";

interface PreferencesChannelTabsMobileViewProps {
  readonly labels: ProfileNotificationsLabels;
  readonly preferences: readonly NotificationPrefRow[];
  readonly preferenceMap: ReadonlyMap<string, NotificationPrefRow>;
  readonly eventTypes?: readonly NotificationEventType[];
  /** Category grouping rows — one per category for master mute toggles. */
  readonly categoryRows?: readonly CategoryRow[];
  readonly onToggle: (channel: NotificationChannel, eventType: NotificationEventType, enabled: boolean) => void;
  readonly onCategoryToggle?: (category: NotificationEventCategory, enabled: boolean) => void;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly activeChannel: NotificationChannel;
  readonly slideDirection: "left" | "right";
  readonly onChannelChange: (channel: NotificationChannel, slideDirection: "left" | "right") => void;
}

export function PreferencesChannelTabsMobileView({
  labels,
  preferences,
  preferenceMap,
  eventTypes = NOTIFICATION_EVENT_TYPES,
  categoryRows,
  onToggle,
  onCategoryToggle,
  disabled = false,
  loading = false,
  activeChannel,
  slideDirection,
  onChannelChange,
}: Readonly<PreferencesChannelTabsMobileViewProps>) {
  const eventLabels = labels.events as Record<string, string>;
  const getEventLabel = (eventType: NotificationEventType): string => eventLabels[eventType] ?? eventType;

  const handleChannelChange = (_: SyntheticEvent, value: NotificationChannel) => {
    const nextIndex = CHANNEL_ORDER.indexOf(value);
    const prevIndex = CHANNEL_ORDER.indexOf(activeChannel);
    const direction: "left" | "right" = nextIndex > prevIndex ? "left" : "right";
    onChannelChange(value, direction);
  };

  if (loading && preferences.length === 0) {
    return <ChannelTabsSkeleton />;
  }

  const activeAccent = NOTIFICATION_CHANNEL_ACCENTS[activeChannel];

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
      <ChannelTabBar
        activeChannel={activeChannel}
        activeAccent={activeAccent}
        channelLabels={labels.channels}
        onChange={handleChannelChange}
      />
      <PreferenceList
        activeChannel={activeChannel}
        activeAccent={activeAccent}
        slideDirection={slideDirection}
        categoryRows={categoryRows}
        categoryLabels={labels.categories}
        eventTypes={eventTypes}
        preferenceMap={preferenceMap}
        disabled={disabled}
        getEventLabel={getEventLabel}
        onToggle={onToggle}
        onCategoryToggle={onCategoryToggle}
      />
    </Box>
  );
}
