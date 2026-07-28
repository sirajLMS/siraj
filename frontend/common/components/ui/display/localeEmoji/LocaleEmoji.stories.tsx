import { Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LocaleEmoji } from "@/frontend/common/components/ui/display/localeEmoji/LocaleEmoji";

const meta: Meta<typeof LocaleEmoji> = {
  title: "UI/Display/LocaleEmoji",
  component: LocaleEmoji,
  tags: ["autodocs"],
  args: {
    emoji: "🇪🇬",
  },
};

export default meta;
type Story = StoryObj<typeof LocaleEmoji>;

export const Default: Story = {};

export const InlineWithText: Story = {
  render: args => (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <LocaleEmoji {...args} />
      <Typography variant="bodyMd">Egypt</Typography>
    </Stack>
  ),
};

export const WithCustomSx: Story = {
  args: {
    emoji: "🌐",
    sx: { fontSize: 32 },
  },
};

export const LanguageFlag: Story = {
  args: {
    emoji: "🇸🇦",
  },
};
