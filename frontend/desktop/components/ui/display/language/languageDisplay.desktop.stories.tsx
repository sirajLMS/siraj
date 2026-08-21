import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppLanguage } from "@/frontend/common/graphql/generated/gql/graphql";
import { DesktopLanguageDisplay } from "@/frontend/desktop/components/ui/display/language/languageDisplay.desktop";

const meta: Meta<typeof DesktopLanguageDisplay> = {
  title: "UI/LanguageDisplay/Desktop",
  component: DesktopLanguageDisplay,
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
type Story = StoryObj<typeof DesktopLanguageDisplay>;

export const Default: Story = {
  args: { code: AppLanguage.Ar },
};

export const EmojiOnly: Story = {
  args: { code: AppLanguage.Ar, showLabel: false },
};

export const LabelOnly: Story = {
  args: { code: AppLanguage.Ar, showEmoji: false },
};

export const UnknownCode: Story = {
  args: { code: null, fallback: "Unknown language" },
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  args: { code: AppLanguage.Ar },
};
