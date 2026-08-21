import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { MobileTimezoneDisplay } from "@/frontend/mobile/components/ui/display/timezoneDisplay/timezoneDisplay.mobile";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

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
    timezone: IanaTimezone.Africa_Cairo,
  },
};

export const WithoutOffset: Story = {
  args: {
    timezone: IanaTimezone.Asia_Riyadh,
    showOffset: false,
  },
};

export const IconOnly: Story = {
  args: {
    timezone: IanaTimezone.Africa_Cairo,
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
    timezone: IanaTimezone.Asia_Dubai,
  },
};
