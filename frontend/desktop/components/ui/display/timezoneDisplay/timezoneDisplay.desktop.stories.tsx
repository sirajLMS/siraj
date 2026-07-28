import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DesktopTimezoneDisplay } from "@/frontend/desktop/components/ui/display/timezoneDisplay/timezoneDisplay.desktop";

const meta: Meta<typeof DesktopTimezoneDisplay> = {
  title: "UI/TimezoneDisplay/Desktop",
  component: DesktopTimezoneDisplay,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof DesktopTimezoneDisplay>;

export const Default: Story = {
  args: {
    timezone: "Africa/Cairo",
  },
};

export const WithoutOffset: Story = {
  args: {
    timezone: "Asia/Riyadh",
    showOffset: false,
  },
};

export const UnknownFallback: Story = {
  args: {
    timezone: null,
    fallback: "Not set",
  },
};

export const Arabic: Story = {
  globals: {
    locale: "ar",
  },
  args: {
    timezone: "Asia/Dubai",
  },
};
