"use client";

import { Box, Slide, Stack } from "@mui/material";
import type { NotificationChannel, NotificationEventType } from "@/frontend/common/graphql/generated/gql/graphql";
import type { NotificationChannelAccent } from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferencesConstants";
import type {
  CategoryRow,
  NotificationEventCategory,
  NotificationPrefRow,
} from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes";
import {
  CategoryToggleRow,
  EventToggleRow,
} from "@/frontend/mobile/views/dashboard/profile/core/notifications/preferencesChannelToggleRows.parts";

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

export function PreferenceList({
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
