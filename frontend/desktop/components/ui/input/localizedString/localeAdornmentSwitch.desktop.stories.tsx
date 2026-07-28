import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { LocaleAdornmentSwitchDesktop } from "@/frontend/desktop/components/ui/input/localizedString/localeAdornmentSwitch.desktop";
import type { AppLocale } from "@/shared/i18n/routing";

function LocaleAdornmentSwitchDesktopStory({
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
      <LocaleAdornmentSwitchDesktop
        activeLocale={activeLocale}
        onChangeAction={setActiveLocale}
        variant={variant}
        compact={compact}
        disabled={disabled}
      />
    </Box>
  );
}

const meta: Meta<typeof LocaleAdornmentSwitchDesktopStory> = {
  title: "UI/LocaleAdornmentSwitch/Desktop",
  component: LocaleAdornmentSwitchDesktopStory,
  tags: ["ai-generated"],
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
type Story = StoryObj<typeof LocaleAdornmentSwitchDesktopStory>;

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
