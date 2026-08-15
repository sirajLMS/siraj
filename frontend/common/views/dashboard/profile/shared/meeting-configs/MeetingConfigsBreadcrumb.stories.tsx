import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MeetingConfigsBreadcrumb } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigsBreadcrumb";

const meta = {
  title: "Views/dashboard/profile/shared/meeting-configs/MeetingConfigsBreadcrumb",
  component: MeetingConfigsBreadcrumb,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof MeetingConfigsBreadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

const labels = {
  profileLabel: "Profile",
  meetingConfigsLabel: "Meeting Configurations",
};

export const Default: Story = {
  args: { labels },
};
