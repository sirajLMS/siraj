import type { Meta, StoryObj } from "@storybook/react";
import { MobileTimezoneDisplay } from "@/frontend/mobile/components/ui/display/timezoneDisplay/timezoneDisplay.mobile";

const meta: Meta<typeof MobileTimezoneDisplay> = {
  title: "UI/TimezoneDisplay/Mobile",
  component: MobileTimezoneDisplay,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: {
        mobile1: {
          name: "Mobile (375px)",
          styles: { width: "375px", height: "667px" },
        },
        mobile2: {
          name: "Mobile Large (414px)",
          styles: { width: "414px", height: "896px" },
        },
        tablet: {
          name: "Tablet (768px)",
          styles: { width: "768px", height: "1024px" },
        },
        desktop: {
          name: "Desktop (1280px)",
          styles: { width: "1280px", height: "800px" },
        },
      },
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
