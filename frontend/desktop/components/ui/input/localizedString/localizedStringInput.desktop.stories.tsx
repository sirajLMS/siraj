import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import type { LocalizedStringInputProps } from "@/frontend/common/components/ui/input/localizedString/types";
import type { LocalizedString } from "@/frontend/common/types/localized-string.types";
import { LocalizedStringInputDesktop } from "@/frontend/desktop/components/ui/input/localizedString/localizedStringInput.desktop";

function LocalizedStringInputStory({
  initialValue = {},
  ...props
}: Readonly<Omit<LocalizedStringInputProps, "value" | "onChangeAction"> & { initialValue?: LocalizedString }>) {
  const [value, setValue] = useState<LocalizedString>(initialValue);

  return (
    <Box sx={{ p: 2, maxWidth: 640 }}>
      <LocalizedStringInputDesktop value={value} onChangeAction={setValue} {...props} />
    </Box>
  );
}

const meta: Meta<typeof LocalizedStringInputStory> = {
  title: "UI/LocalizedStringInput/Desktop",
  component: LocalizedStringInputStory,
  tags: ["ai-generated"],
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
