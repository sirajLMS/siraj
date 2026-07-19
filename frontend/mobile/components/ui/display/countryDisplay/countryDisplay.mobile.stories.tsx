import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { MobileCountryDisplay } from "@/frontend/mobile/components/ui/display/countryDisplay/countryDisplay.mobile";

const meta: Meta<typeof MobileCountryDisplay> = {
  title: "UI/CountryDisplay/Mobile",
  component: MobileCountryDisplay,
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
  decorators: [
    Story => (
      <Box sx={{ p: 2 }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MobileCountryDisplay>;

export const Default: Story = {
  args: { code: "SA" },
};

export const EmojiOnly: Story = {
  args: { code: "SA", showLabel: false },
};

export const LabelOnly: Story = {
  args: { code: "SA", showEmoji: false },
};

export const UnknownCode: Story = {
  args: { code: "ZZ", fallback: "Unknown country" },
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  args: { code: "SA" },
};
