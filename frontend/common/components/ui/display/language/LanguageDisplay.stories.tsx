import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LanguageDisplay } from "@/frontend/common/components/ui/display/language/LanguageDisplay";
import { AppLanguage } from "@/frontend/common/graphql/generated/gql/graphql";

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
