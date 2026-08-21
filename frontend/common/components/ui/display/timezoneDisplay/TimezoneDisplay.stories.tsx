import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TimezoneDisplay } from "@/frontend/common/components/ui/display/timezoneDisplay/TimezoneDisplay";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

const meta: Meta<typeof TimezoneDisplay> = {
  title: "UI/Display/TimezoneDisplay",
  component: TimezoneDisplay,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof TimezoneDisplay>;

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
