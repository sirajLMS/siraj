import type { Meta, StoryObj } from "@storybook/react";
import { PhoneDisplay } from "@/frontend/components/ui/display/PhoneDisplay";

const meta: Meta<typeof PhoneDisplay> = {
  title: "UI/Display/PhoneDisplay",
  component: PhoneDisplay,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof PhoneDisplay>;

export const Default: Story = {
  args: {
    phone: "+201012345678",
  },
};

export const Masked: Story = {
  args: {
    phone: "+201012345678",
    masked: true,
    defaultRegion: "EG",
  },
};

export const Saudi: Story = {
  args: {
    phone: "+966501234567",
  },
};

export const EmptyFallback: Story = {
  args: {
    phone: null,
    fallback: "Not set",
  },
};

export const Arabic: Story = {
  globals: {
    locale: "ar",
  },
  args: {
    phone: "+971501234567",
  },
};
