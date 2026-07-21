import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useForm } from "react-hook-form";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import type { LocalizedString } from "@/frontend/common/types/localized-string.types";
import { LocalizedStringFormFieldMobile } from "@/frontend/mobile/components/ui/input/localizedString/localizedStringFormField.mobile";

type FormValues = {
  name: LocalizedString;
};

type LocalizedStringFormFieldStoryProps = {
  readonly defaultValue?: LocalizedString;
  readonly label?: string;
  readonly required?: boolean;
  readonly error?: boolean;
  readonly errorMessage?: string;
  readonly disabled?: boolean;
};

function LocalizedStringFormFieldStory({
  defaultValue = {},
  label = "Name",
  required,
  error,
  errorMessage,
  disabled,
}: Readonly<LocalizedStringFormFieldStoryProps>) {
  const { control } = useForm<FormValues>({
    defaultValues: { name: defaultValue },
  });

  return (
    <Box sx={{ width: "100%", maxWidth: 375, p: 2 }}>
      <LocalizedStringFormFieldMobile
        name="name"
        control={control}
        label={label}
        required={required}
        error={error}
        errorMessage={errorMessage}
        disabled={disabled}
      />
    </Box>
  );
}

const meta: Meta<typeof LocalizedStringFormFieldStory> = {
  title: "UI/LocalizedStringFormField/Mobile",
  component: LocalizedStringFormFieldStory,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
    },
  },
};

export default meta;
type Story = StoryObj<typeof LocalizedStringFormFieldStory>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    defaultValue: { ar: "فودافون كاش", en: "Vodafone Cash" },
  },
};

export const Required: Story = {
  args: {
    required: true,
  },
};

export const WithError: Story = {
  args: {
    defaultValue: { en: "Vodafone Cash" },
    error: true,
    errorMessage: "Arabic is required for this field",
  },
};
