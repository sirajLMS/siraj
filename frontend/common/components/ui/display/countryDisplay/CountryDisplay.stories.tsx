import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CountryDisplay } from "@/frontend/common/components/ui/display/countryDisplay/CountryDisplay";
import { CountryCode } from "@/frontend/common/graphql/generated/gql/graphql";

const meta: Meta<typeof CountryDisplay> = {
  title: "UI/Display/CountryDisplay",
  component: CountryDisplay,
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
type Story = StoryObj<typeof CountryDisplay>;

export const Default: Story = {
  args: { code: CountryCode.Sa },
};

export const EmojiOnly: Story = {
  args: { code: CountryCode.Sa, showLabel: false },
};

export const LabelOnly: Story = {
  args: { code: CountryCode.Sa, showEmoji: false },
};

export const UnknownCode: Story = {
  args: { code: null, fallback: "Unknown country" },
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  args: { code: CountryCode.Sa },
};
