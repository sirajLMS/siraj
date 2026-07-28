import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { MobilePhoneDisplay } from "@/frontend/mobile/components/ui/display/phoneDisplay/phoneDisplay.mobile";

const meta: Meta<typeof MobilePhoneDisplay> = {
  title: "UI/PhoneDisplay/Mobile",
  component: MobilePhoneDisplay,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
    },
  },
};

export default meta;
type Story = StoryObj<typeof MobilePhoneDisplay>;

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
