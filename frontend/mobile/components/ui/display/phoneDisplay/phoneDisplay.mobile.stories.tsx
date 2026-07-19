import type { Meta, StoryObj } from "@storybook/react";
import { MobilePhoneDisplay } from "@/frontend/mobile/components/ui/display/phoneDisplay/phoneDisplay.mobile";

const meta: Meta<typeof MobilePhoneDisplay> = {
  title: "UI/PhoneDisplay/Mobile",
  component: MobilePhoneDisplay,
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
