import { Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { MobileLocaleEmoji } from "@/frontend/mobile/components/ui/display/localeEmoji/localeEmoji.mobile";

const meta: Meta<typeof MobileLocaleEmoji> = {
  title: "UI/LocaleEmoji/Mobile",
  component: MobileLocaleEmoji,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
    },
  },
  args: {
    emoji: "🇪🇬",
  },
};

export default meta;
type Story = StoryObj<typeof MobileLocaleEmoji>;

export const Default: Story = {};

export const InlineWithText: Story = {
  render: args => (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <MobileLocaleEmoji {...args} />
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
