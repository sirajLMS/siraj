import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MeetingIntegrationsBreadcrumb } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/MeetingIntegrationsBreadcrumb";

const meta = {
  title: "Views/dashboard/settings/components/meetingIntegrations/MeetingIntegrationsBreadcrumb",
  component: MeetingIntegrationsBreadcrumb,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof MeetingIntegrationsBreadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

const labels = {
  settingsLabel: "Settings",
  meetingIntegrationsLabel: "Meeting Integrations",
};

export const Default: Story = {
  args: { labels },
};
