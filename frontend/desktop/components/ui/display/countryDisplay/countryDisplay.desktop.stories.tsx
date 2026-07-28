import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DesktopCountryDisplay } from "@/frontend/desktop/components/ui/display/countryDisplay/countryDisplay.desktop";

const meta: Meta<typeof DesktopCountryDisplay> = {
  title: "UI/CountryDisplay/Desktop",
  component: DesktopCountryDisplay,
  tags: ["ai-generated"],
  decorators: [
    Story => (
      <Box sx={{ p: 2 }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DesktopCountryDisplay>;

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
