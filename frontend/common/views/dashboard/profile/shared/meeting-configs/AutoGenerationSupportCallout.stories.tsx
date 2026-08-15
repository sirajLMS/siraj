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
  learnMore: "Learn more",
  learnLess: "Show less",
  summary: "Siraj auto-generates meeting URLs so you never have to copy/paste links again.",
  createConfig: "Create config",
  step1Title: "Connect",
  step1Description: "Connect a meeting provider (Zoom, Google Meet) under Integrations.",
  step2Title: "Create config",
  step2Description: "Create a meeting config and enable the Auto-Generated toggle.",
  step3Title: "Auto-generate at booking",
  step3Description: "A fresh URL is generated automatically when a booking is confirmed.",
};

export const Default: Story = {
  args: { labels },
};

export const WithCreateConfigAction: Story = {
  args: {
    labels,
    onCreateConfig: () => {},
  },
};

export const WithCreateConfigHref: Story = {
  args: {
    labels,
    createConfigHref: "/dashboard/profile/meeting-configs/new",
  },
};
