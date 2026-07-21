import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { MobileLocalizedStringDisplay } from "@/frontend/mobile/components/ui/display/localizedStringDisplay/localizedStringDisplay.mobile";

const meta: Meta<typeof MobileLocalizedStringDisplay> = {
  title: "UI/LocalizedStringDisplay/Mobile",
  component: MobileLocalizedStringDisplay,
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
type Story = StoryObj<typeof MobileLocalizedStringDisplay>;

export const ArabicOnly: Story = {
  args: { value: { ar: "فودافون كاش" } },
};

export const EnglishOnly: Story = {
  args: { value: { en: "Vodafone Cash" } },
};

export const BothLocalesArUi: Story = {
  globals: { locale: "ar" },
  args: { value: { ar: "فودافون كاش", en: "Vodafone Cash" } },
};

export const BothLocalesEnUi: Story = {
  globals: { locale: "en" },
  args: { value: { ar: "فودافون كاش", en: "Vodafone Cash" } },
};

export const EmptyMap: Story = {
  args: { value: { ar: "", en: "" }, fallback: "—" },
};

export const NullMap: Story = {
  args: { value: null, fallback: "—" },
};

export const ArabicRequiredFromEnglishUi: Story = {
  globals: { locale: "en" },
  args: { value: { ar: "فودافون كاش" } },
};

export const FallbackToFirstAvailable: Story = {
  globals: { locale: "en" },
  args: { value: { en: "Vodafone Cash" } },
};

export const CustomVariant: Story = {
  args: {
    value: { ar: "العنوان", en: "The Title" },
    typographyVariant: "h6",
  },
};
