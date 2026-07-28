import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { AppLanguage } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { type LanguageType, languages } from "@/frontend/common/lib/locale";
import type { LanguageSelectorProps } from "@/frontend/mobile/components/ui/input/languageSelector/LanguageSelector";
import { LanguageSelectorMobile } from "@/frontend/mobile/components/ui/input/languageSelector/languageSelector.mobile";

function LanguageSelectorMobileStory({
  initialLanguageCode,
  ...props
}: Readonly<Partial<LanguageSelectorProps> & { initialLanguageCode?: string }>) {
  const [language, setLanguage] = useState<LanguageType | undefined>(() =>
    initialLanguageCode ? languages.find(entry => entry.code === initialLanguageCode) : undefined
  );

  return (
    <Box sx={{ width: 400, p: 2 }}>
      <LanguageSelectorMobile language={language} setLanguageAction={setLanguage} fullWidth {...props} />
    </Box>
  );
}

const meta: Meta<typeof LanguageSelectorMobileStory> = {
  title: "UI/LanguageSelector/Mobile",
  component: LanguageSelectorMobileStory,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile",
      viewports: {
        mobile: {
          name: "Mobile (375px)",
          styles: { width: "375px", height: "667px" },
        },
        mobileLarge: {
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
};

export default meta;
type Story = StoryObj<typeof LanguageSelectorMobileStory>;

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
