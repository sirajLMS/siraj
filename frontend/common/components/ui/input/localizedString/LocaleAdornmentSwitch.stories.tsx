import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { LocaleAdornmentSwitch } from "@/frontend/common/components/ui/input/localizedString/LocaleAdornmentSwitch";
import type { AppLocale } from "@/shared/i18n/routing";

function LocaleAdornmentSwitchStory({
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
      <LocaleAdornmentSwitch
        activeLocale={activeLocale}
        onChangeAction={setActiveLocale}
        variant={variant}
        compact={compact}
        disabled={disabled}
      />
    </Box>
  );
}

const meta: Meta<typeof LocaleAdornmentSwitchStory> = {
  title: "UI/Input/LocaleAdornmentSwitch",
  component: LocaleAdornmentSwitchStory,
  tags: ["autodocs"],
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
type Story = StoryObj<typeof LocaleAdornmentSwitchStory>;

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

export const AdornmentVariant: Story = {
  args: { variant: "adornment" },
};

export const EnglishChrome: Story = {
  globals: { locale: "en" },
  args: { initialLocale: "ar" },
};
