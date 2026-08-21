import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { AppLanguage } from "@/frontend/common/graphql/generated/gql/graphql";
import { type LanguageType, languages } from "@/frontend/common/lib/locale";
import {
  LanguageSelectorDesktop,
  type LanguageSelectorProps,
} from "@/frontend/desktop/components/ui/input/languageSelector/languageSelector.desktop";

function LanguageSelectorDesktopStory({
  initialLanguageCode,
  ...props
}: Readonly<Partial<LanguageSelectorProps> & { initialLanguageCode?: AppLanguage }>) {
  const [language, setLanguage] = useState<LanguageType | undefined>(() =>
    initialLanguageCode ? languages.find(entry => entry.code === initialLanguageCode) : undefined
  );

  return (
    <Box sx={{ width: 400, p: 2 }}>
      <LanguageSelectorDesktop language={language} setLanguageAction={setLanguage} fullWidth {...props} />
    </Box>
  );
}

const meta: Meta<typeof LanguageSelectorDesktopStory> = {
  title: "UI/LanguageSelector/Desktop",
  component: LanguageSelectorDesktopStory,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof LanguageSelectorDesktopStory>;

export const Default: Story = {
  args: {
    initialLanguageCode: AppLanguage.Ar,
  },
};

export const Empty: Story = {};

export const Required: Story = {
  args: {
    initialLanguageCode: AppLanguage.En,
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    initialLanguageCode: AppLanguage.Ar,
    disabled: true,
  },
};

export const Arabic: Story = {
  globals: {
    locale: "ar",
  },
  args: {
    initialLanguageCode: AppLanguage.Ar,
  },
};
