import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import type { LocalizedStringInputProps } from "@/frontend/common/components/ui/input/localizedString/types";
import type { LocalizedString } from "@/frontend/common/types/localized-string.types";
import { LocalizedStringInputMobile } from "@/frontend/mobile/components/ui/input/localizedString/localizedStringInput.mobile";

function LocalizedStringInputStory({
  initialValue = {},
  ...props
}: Readonly<Omit<LocalizedStringInputProps, "value" | "onChangeAction"> & { initialValue?: LocalizedString }>) {
  const [value, setValue] = useState<LocalizedString>(initialValue);

  return (
    <Box sx={{ p: 2, maxWidth: 375 }}>
      <LocalizedStringInputMobile value={value} onChangeAction={setValue} {...props} />
    </Box>
  );
}

const meta: Meta<typeof LocalizedStringInputStory> = {
  title: "UI/LocalizedStringInput/Mobile",
  component: LocalizedStringInputStory,
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
};

export default meta;
type Story = StoryObj<typeof LocalizedStringInputStory>;

export const Default: Story = {
  args: {
    label: "Name",
    required: true,
    initialValue: { ar: "فودافون كاش", en: "Vodafone Cash" },
  },
};

export const Empty: Story = {
  args: {
    label: "Name",
    required: true,
  },
};

export const RequiredError: Story = {
  args: {
    label: "Name",
    required: true,
    error: true,
    errorMessage: "Arabic is required for this field",
    initialValue: { en: "Vodafone Cash" },
  },
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  args: {
    label: "الاسم",
    required: true,
    initialValue: { ar: "فودافون كاش", en: "Vodafone Cash" },
  },
};
