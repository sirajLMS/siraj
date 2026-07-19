import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { LocaleAdornmentSwitchMobile } from "@/frontend/mobile/components/ui/input/localizedString/localeAdornmentSwitch.mobile";
import type { AppLocale } from "@/shared/i18n/routing";

function LocaleAdornmentSwitchMobileStory({
  initialLocale = "ar",
  variant = "standalone",
  compact = false,
  disabled = false,
}: Readonly<{
  initialLocale?: AppLocale;
  variant?: "adornment" | "standalone";
  compact?: boolean;
  disabled?: boolean;
}>) {
  const [activeLocale, setActiveLocale] = useState<AppLocale>(initialLocale);

  return (
    <Box sx={{ p: 2 }}>
      <LocaleAdornmentSwitchMobile
        activeLocale={activeLocale}
        onChangeAction={setActiveLocale}
        variant={variant}
        compact={compact}
        disabled={disabled}
      />
    </Box>
  );
}

const meta: Meta<typeof LocaleAdornmentSwitchMobileStory> = {
  title: "UI/LocaleAdornmentSwitch/Mobile",
  component: LocaleAdornmentSwitchMobileStory,
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
  argTypes: {
    initialLocale: {
      control: "select",
      options: ["ar", "en"],
    },
    variant: {
      control: "select",
      options: ["adornment", "standalone"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof LocaleAdornmentSwitchMobileStory>;

export const Default: Story = {};

export const EnglishActive: Story = {
  args: { initialLocale: "en" },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Compact: Story = {
  args: { compact: true },
};
