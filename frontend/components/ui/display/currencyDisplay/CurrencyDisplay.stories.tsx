import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { CurrencyDisplay } from "@/frontend/components/ui/display/currencyDisplay/CurrencyDisplay";

const meta: Meta<typeof CurrencyDisplay> = {
  title: "UI/Display/CurrencyDisplay",
  component: CurrencyDisplay,
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
type Story = StoryObj<typeof CurrencyDisplay>;

export const Default: Story = {
  args: { code: "SAR" },
};

export const EmojiOnly: Story = {
  args: { code: "SAR", showLabel: false },
};

export const LabelOnly: Story = {
  args: { code: "SAR", showFlag: false },
};

export const WithSymbolAndCode: Story = {
  args: { code: "EGP", showSymbol: true, showCode: true },
};

export const UnknownCode: Story = {
  args: { code: "ZZZ", fallback: "Unknown currency" },
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  args: { code: "SAR", showSymbol: true, showCode: true },
};
