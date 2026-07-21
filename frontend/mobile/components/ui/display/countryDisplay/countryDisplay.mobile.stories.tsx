import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { MobileCountryDisplay } from "@/frontend/mobile/components/ui/display/countryDisplay/countryDisplay.mobile";

const meta: Meta<typeof MobileCountryDisplay> = {
  title: "UI/CountryDisplay/Mobile",
  component: MobileCountryDisplay,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
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
