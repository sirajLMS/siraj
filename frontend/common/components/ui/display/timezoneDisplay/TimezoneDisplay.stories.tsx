import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TimezoneDisplay } from "@/frontend/common/components/ui/display/timezoneDisplay/TimezoneDisplay";
import { IanaTimezone } from "@/frontend/common/graphql/generated/gql/graphql-types";

const meta: Meta<typeof TimezoneDisplay> = {
  title: "UI/Display/TimezoneDisplay",
  component: TimezoneDisplay,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof TimezoneDisplay>;

export const Default: Story = {
  args: {
    timezone: "Africa/Cairo",
  },
};

export const WithoutOffset: Story = {
  args: {
    timezone: IanaTimezone.AsiaRiyadh,
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
