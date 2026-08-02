import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AutoGenerationSupportCallout } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/AutoGenerationSupportCallout";
import type { ProfileNotificationsLabels } from "@/shared/locale/types/profile";

const meta = {
  title: "Views/dashboard/profile/shared/meeting-configs/AutoGenerationSupportCallout",
  component: AutoGenerationSupportCallout,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof AutoGenerationSupportCallout>;

export default meta;
type Story = StoryObj<typeof meta>;

const labels: ProfileNotificationsLabels["autoGeneration"] = {
  title: "Auto-Generated Meeting URLs",
  onSave: "Automatically generates a meeting URL when you save the meeting config.",
  preview: "Previews the generated URL before the class starts.",
  booking: "Generates a fresh URL when a booking is confirmed.",
  learnMore: "Learn more about auto-generation",
};

export const Default: Story = {
  args: { labels },
};

export const WithCustomLearnMoreHref: Story = {
  args: {
    labels,
    learnMoreHref: "/dashboard/help/auto-meeting-urls",
  },
};
