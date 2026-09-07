import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import {
  SyncCompletePanel,
  SyncFailedPanel,
  type SyncPanelLabels,
  SyncProgressPanel,
} from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/NumberCardSyncPanels";
import { whatsappEn } from "@/shared/locale/en/whatsapp";

const labels: SyncPanelLabels = whatsappEn;

const futureDeadline = () => new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();

const meta = {
  title: "Views/dashboard/settings/whatsapp/tabs/shared/NumberCardSyncPanels",
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta;

export default meta;

export const Syncing: StoryObj<typeof SyncProgressPanel> = {
  name: "Sync Progress (SYNCING with phase + deadline)",
  args: { labels, phase: 3, progress: 64, syncDeadlineAt: futureDeadline() },
  render: args => <SyncProgressPanel {...args} />,
};

export const SyncingWithoutPhase: StoryObj<typeof SyncProgressPanel> = {
  name: "Sync Progress (no phase, no deadline)",
  args: { labels, phase: null, progress: null },
  render: args => <SyncProgressPanel {...args} />,
};

export const FailedHistoryDeclined: StoryObj<typeof SyncFailedPanel> = {
  name: "Sync Failed (history declined + retry)",
  args: { labels, syncFailureReason: "historyDeclined", onRetrySetup: fn() },
  render: args => <SyncFailedPanel {...args} />,
};

export const FailedGeneric: StoryObj<typeof SyncFailedPanel> = {
  name: "Sync Failed (generic reason, no retry)",
  args: { labels, syncFailureReason: "Meta rejected the sync token" },
  render: args => <SyncFailedPanel {...args} />,
};

export const Complete: StoryObj<typeof SyncCompletePanel> = {
  name: "Sync Complete",
  args: { labels, completedAt: new Date().toISOString() },
  render: args => <SyncCompletePanel {...args} />,
};

export const CompleteWithoutDate: StoryObj<typeof SyncCompletePanel> = {
  name: "Sync Complete (no completion date)",
  args: { labels, completedAt: null },
  render: args => <SyncCompletePanel {...args} />,
};
