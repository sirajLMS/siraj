import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { MobileTimezoneDisplay } from "@/frontend/mobile/components/ui/display/timezoneDisplay/timezoneDisplay.mobile";

const meta: Meta<typeof MobileTimezoneDisplay> = {
  title: "UI/TimezoneDisplay/Mobile",
  component: MobileTimezoneDisplay,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
    },
  },
};

export default meta;
type Story = StoryObj<typeof MobileTimezoneDisplay>;

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

export const IconOnly: Story = {
  args: {
    timezone: "Africa/Cairo",
    displayType: "iconOnly",
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
