import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { createMeetingIntegrationLabelsMock } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/meetingIntegrationsStoryMocks";
import { ProfileLinkCallout } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/ProfileLinkCallout";

const meta = {
  title: "Views/dashboard/settings/components/meetingIntegrations/ProfileLinkCallout",
  component: ProfileLinkCallout,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof ProfileLinkCallout>;

export default meta;
type Story = StoryObj<typeof meta>;

const labels = createMeetingIntegrationLabelsMock();

export const Default: Story = {
  args: {
    labels,
    onNavigate: () => {},
  },
};
