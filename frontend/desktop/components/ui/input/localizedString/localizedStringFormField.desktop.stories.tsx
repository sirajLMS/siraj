import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useForm } from "react-hook-form";
import { LocalizedStringFormFieldDesktop } from "@/frontend/desktop/components/ui/input/localizedString/localizedStringFormField.desktop";
import type { LocalizedString } from "@/shared/types";

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
    <Box sx={{ width: 400, p: 2 }}>
      <LocalizedStringFormFieldDesktop
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
  title: "UI/LocalizedStringFormField/Desktop",
  component: LocalizedStringFormFieldStory,
  tags: ["ai-generated"],
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
