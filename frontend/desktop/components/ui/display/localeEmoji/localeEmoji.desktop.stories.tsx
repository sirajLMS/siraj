import { Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { DesktopLocaleEmoji } from "@/frontend/desktop/components/ui/display/localeEmoji/localeEmoji.desktop";

const meta: Meta<typeof DesktopLocaleEmoji> = {
  title: "UI/LocaleEmoji/Desktop",
  component: DesktopLocaleEmoji,
  tags: ["ai-generated"],
  args: {
    emoji: "🇪🇬",
  },
};

export default meta;
type Story = StoryObj<typeof DesktopLocaleEmoji>;

export const Default: Story = {};

export const InlineWithText: Story = {
  render: args => (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <DesktopLocaleEmoji {...args} />
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
