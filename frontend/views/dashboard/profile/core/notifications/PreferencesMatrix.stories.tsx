"use client";

import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { NotificationChannel, NotificationEventType } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENT_TYPES,
  preferenceKey,
} from "@/frontend/views/dashboard/profile/core/notifications/notificationPreferenceTypes";
import { PreferencesMatrix } from "@/frontend/views/dashboard/profile/core/notifications/PreferencesMatrix";

const mockPreferences = NOTIFICATION_CHANNELS.flatMap(channel =>
  NOTIFICATION_EVENT_TYPES.map(eventType => ({
    id: preferenceKey(channel, eventType),
    channel,
    eventType,
    enabled: !(channel === NotificationChannel.Sms && eventType === NotificationEventType.ClassReminder),
  }))
);

const meta: Meta<typeof PreferencesMatrix> = {
  title: "Views/profile/core/notifications/PreferencesMatrix",
  component: PreferencesMatrix,
  tags: ["autodocs"],
  decorators: [
    Story => (
      <Box sx={{ maxWidth: 1200, p: 2 }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PreferencesMatrix>;

export const Default: Story = {
  args: {
    preferences: mockPreferences,
    onToggle: () => undefined,
  },
};

export const Loading: Story = {
  args: {
    preferences: [],
    loading: true,
    onToggle: () => undefined,
  },
};

export const Saving: Story = {
  args: {
    preferences: mockPreferences,
    disabled: true,
    onToggle: () => undefined,
  },
};
