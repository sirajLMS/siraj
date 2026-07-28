import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { MobileLanguageDisplay } from "@/frontend/mobile/components/ui/display/language/languageDisplay.mobile";

const meta: Meta<typeof MobileLanguageDisplay> = {
  title: "UI/LanguageDisplay/Mobile",
  component: MobileLanguageDisplay,
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
type Story = StoryObj<typeof MobileLanguageDisplay>;

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
