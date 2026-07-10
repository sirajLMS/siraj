import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  LanguageSelector,
  type LanguageSelectorProps,
} from "@/frontend/components/ui/input/languageSelector/LanguageSelector";
import { AppLanguage } from "@/frontend/graphql/generated/gql/graphql-types";
import { type LanguageType, languages } from "@/frontend/lib/locale";

function LanguageSelectorStory({
  initialLanguageCode,
  ...props
}: Readonly<Partial<LanguageSelectorProps> & { initialLanguageCode?: string }>) {
  const [language, setLanguage] = useState<LanguageType | undefined>(() =>
    initialLanguageCode ? languages.find(entry => entry.code === initialLanguageCode) : undefined
  );

  return (
    <Box sx={{ width: 400, p: 2 }}>
      <LanguageSelector language={language} setLanguageAction={setLanguage} fullWidth {...props} />
    </Box>
  );
}

const meta: Meta<typeof LanguageSelectorStory> = {
  title: "UI/Input/LanguageSelector",
  component: LanguageSelectorStory,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof LanguageSelectorStory>;

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
