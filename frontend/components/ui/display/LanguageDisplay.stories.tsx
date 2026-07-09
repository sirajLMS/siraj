import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { LanguageDisplay } from "./LanguageDisplay";

const meta: Meta<typeof LanguageDisplay> = {
  title: "UI/Display/LanguageDisplay",
  component: LanguageDisplay,
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
type Story = StoryObj<typeof LanguageDisplay>;

export const Default: Story = {
  args: { code: "ar" },
};

export const EmojiOnly: Story = {
  args: { code: "ar", showLabel: false },
};

export const LabelOnly: Story = {
  args: { code: "ar", showEmoji: false },
};

export const UnknownCode: Story = {
  args: { code: "xx", fallback: "Unknown language" },
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  args: { code: "ar" },
};
