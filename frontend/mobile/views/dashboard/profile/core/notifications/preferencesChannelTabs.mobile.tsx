"use client";

import { Box, FormControlLabel, Skeleton, Slide, Stack, Switch, Tab, Tabs, Typography } from "@mui/material";
import type { SyntheticEvent } from "react";
import type { NotificationChannel, NotificationEventType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  NOTIFICATION_CHANNEL_ACCENTS,
  NOTIFICATION_CHANNEL_ICONS,
  type NotificationChannelAccent,
} from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferencesConstants";
import {
  type CategoryRow,
  NOTIFICATION_EVENT_TYPES,
  type NotificationEventCategory,
  type NotificationPrefRow,
} from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes";
import { CHANNEL_ORDER } from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceUtils";
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

interface ChannelTabBarProps {
  readonly activeChannel: NotificationChannel;
  readonly activeAccent: NotificationChannelAccent;
  readonly channelLabels: Record<string, string>;
  readonly onChange: (event: SyntheticEvent, value: NotificationChannel) => void;
}

function ChannelTabBar({ activeChannel, activeAccent, channelLabels, onChange }: Readonly<ChannelTabBarProps>) {
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

interface CategoryToggleRowProps {
  readonly activeChannel: NotificationChannel;
  readonly activeAccent: NotificationChannelAccent;
  readonly catRow: CategoryRow;
  readonly categoryLabel: string;
  readonly disabled: boolean;
  readonly onCategoryToggle?: (category: NotificationEventCategory, enabled: boolean) => void;
}

function CategoryToggleRow({
  activeChannel,
  activeAccent,
  catRow,
  categoryLabel,
  disabled,
  onCategoryToggle,
}: Readonly<CategoryToggleRowProps>) {
  return (
    <FormControlLabel
      key={`cat-${activeChannel}-${catRow.category}`}
      control={
        <Switch
          color={activeAccent}
          checked={catRow.anyEnabled}
          disabled={disabled}
          onChange={(_, checked) => {
            onCategoryToggle?.(catRow.category, checked);
          }}
        />
      }
      label={<Typography sx={{ typography: "labelLg", fontWeight: 700 }}>{categoryLabel}</Typography>}
      labelPlacement="start"
      sx={theme => ({
        mx: 0,
        px: 2,
        py: 1.5,
        width: "100%",
        justifyContent: "space-between",
        backgroundColor: theme.palette.action.selected,
        borderTop: `1px solid ${theme.palette.divider}`,
      })}
    />
  );
}

interface EventToggleRowProps {
  readonly activeChannel: NotificationChannel;
  readonly activeAccent: NotificationChannelAccent;
  readonly eventType: NotificationEventType;
  readonly enabled: boolean;
  readonly disabled: boolean;
  readonly index: number;
  readonly label: string;
  readonly onToggle: (channel: NotificationChannel, eventType: NotificationEventType, enabled: boolean) => void;
}

function EventToggleRow({
  activeChannel,
  activeAccent,
  eventType,
  enabled,
  disabled,
  index,
  label,
  onToggle,
}: Readonly<EventToggleRowProps>) {
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
      label={<Typography sx={{ typography: "bodyMd" }}>{label}</Typography>}
      labelPlacement="start"
      sx={theme => ({
        mx: 0,
        px: 2,
        py: 1.75,
        pl: 4,
        width: "100%",
        justifyContent: "space-between",
        backgroundColor: index % 2 === 1 ? theme.palette.action.hover : "transparent",
      })}
    />
  );
}

interface PreferenceListProps {
  readonly activeChannel: NotificationChannel;
  readonly activeAccent: NotificationChannelAccent;
  readonly slideDirection: "left" | "right";
  readonly categoryRows?: readonly CategoryRow[];
  readonly categoryLabels?: Record<string, string>;
  readonly eventTypes: readonly NotificationEventType[];
  readonly preferenceMap: ReadonlyMap<string, NotificationPrefRow>;
  readonly disabled: boolean;
  readonly getEventLabel: (eventType: NotificationEventType) => string;
  readonly onToggle: (channel: NotificationChannel, eventType: NotificationEventType, enabled: boolean) => void;
  readonly onCategoryToggle?: (category: NotificationEventCategory, enabled: boolean) => void;
}

function PreferenceList({
  activeChannel,
  activeAccent,
  slideDirection,
  categoryRows,
  categoryLabels,
  eventTypes,
  preferenceMap,
  disabled,
  getEventLabel,
  onToggle,
  onCategoryToggle,
}: Readonly<PreferenceListProps>) {
  return (
    <Box sx={{ overflow: "hidden" }}>
      <Slide key={activeChannel} direction={slideDirection} in appear mountOnEnter unmountOnExit timeout={220}>
        <Stack spacing={0}>
          {/* Category-level master toggles */}
          {categoryRows?.map(catRow => {
            const categoryLabel = categoryLabels?.[catRow.category] ?? catRow.category;
            return (
              <CategoryToggleRow
                key={`cat-${activeChannel}-${catRow.category}`}
                activeChannel={activeChannel}
                activeAccent={activeAccent}
                catRow={catRow}
                categoryLabel={categoryLabel}
                disabled={disabled}
                onCategoryToggle={onCategoryToggle}
              />
            );
          })}
          {eventTypes.map((eventType, index) => {
            const pref = preferenceMap.get(`${activeChannel}:${eventType}`);
            const enabled = pref?.enabled ?? true;
            return (
              <EventToggleRow
                key={`${activeChannel}-${eventType}`}
                activeChannel={activeChannel}
                activeAccent={activeAccent}
                eventType={eventType}
                enabled={enabled}
                disabled={disabled}
                index={index}
                label={getEventLabel(eventType)}
                onToggle={onToggle}
              />
            );
          })}
        </Stack>
      </Slide>
    </Box>
  );
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
