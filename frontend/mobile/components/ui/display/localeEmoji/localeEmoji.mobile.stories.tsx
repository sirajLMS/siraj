import { Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { MobileLocaleEmoji } from "@/frontend/mobile/components/ui/display/localeEmoji/localeEmoji.mobile";

const meta: Meta<typeof MobileLocaleEmoji> = {
  title: "UI/LocaleEmoji/Mobile",
  component: MobileLocaleEmoji,
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
