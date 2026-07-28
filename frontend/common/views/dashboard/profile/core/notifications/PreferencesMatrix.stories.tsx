"use client";

import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NotificationChannel, NotificationEventType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  buildPreferenceMap,
  buildPreferenceMatrixRows,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENT_TYPES,
  preferenceKey,
} from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes";
import { PreferencesMatrixDesktopView } from "@/frontend/desktop/views/dashboard/profile/core/notifications/preferencesMatrix.desktop";

const mockPreferences = NOTIFICATION_CHANNELS.flatMap(channel =>
  NOTIFICATION_EVENT_TYPES.map(eventType => ({
    id: preferenceKey(channel, eventType),
    channel,
    eventType,
    enabled: !(channel === NotificationChannel.Sms && eventType === NotificationEventType.ClassReminder),
  }))
);

// NEW FOR PLAN v5: story args build the pre-shaped matrix rows (data-shaping
// now lives in common — the desktop tier takes them as a prop).
const mockMatrixRows = buildPreferenceMatrixRows(buildPreferenceMap(mockPreferences));
const emptyMatrixRows = buildPreferenceMatrixRows(buildPreferenceMap([]));

const meta: Meta<typeof PreferencesMatrixDesktopView> = {
  title: "Views/profile/core/notifications/PreferencesMatrix",
  component: PreferencesMatrixDesktopView,
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
type Story = StoryObj<typeof PreferencesMatrixDesktopView>;

export const Default: Story = {
  args: {
    matrixRows: mockMatrixRows,
    onToggle: () => undefined,
  },
};

export const Loading: Story = {
  args: {
    matrixRows: emptyMatrixRows,
    loading: true,
    onToggle: () => undefined,
  },
};

export const Saving: Story = {
  args: {
    matrixRows: mockMatrixRows,
    disabled: true,
    onToggle: () => undefined,
  },
};
