import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CountryCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { MobileCountryDisplay } from "@/frontend/mobile/components/ui/display/countryDisplay/countryDisplay.mobile";

const meta: Meta<typeof MobileCountryDisplay> = {
  title: "UI/CountryDisplay/Mobile",
  component: MobileCountryDisplay,
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
type Story = StoryObj<typeof MobileCountryDisplay>;

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
