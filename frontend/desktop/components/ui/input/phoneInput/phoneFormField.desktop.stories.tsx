import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useForm } from "react-hook-form";
import { PhoneFormFieldDesktop } from "@/frontend/desktop/components/ui/input/phoneInput/phoneFormField.desktop";

type FormValues = {
  phone: string;
};

type PhoneFormFieldStoryProps = {
  readonly defaultPhone?: string;
  readonly defaultRegion?: string;
  readonly required?: boolean;
  readonly error?: boolean;
  readonly helperText?: string;
  readonly disabled?: boolean;
};

function PhoneFormFieldStory({
  defaultPhone = "",
  defaultRegion = "EG",
  required,
  error,
  helperText,
  disabled,
}: Readonly<PhoneFormFieldStoryProps>) {
  const { control } = useForm<FormValues>({
    defaultValues: { phone: defaultPhone },
  });

  return (
    <Box sx={{ width: 400, p: 2 }}>
      <PhoneFormFieldDesktop
        name="phone"
        control={control}
        defaultRegion={defaultRegion}
        required={required}
        error={error}
        helperText={helperText}
        disabled={disabled}
      />
    </Box>
  );
}

const meta: Meta<typeof PhoneFormFieldStory> = {
  title: "UI/PhoneFormField/Desktop",
  component: PhoneFormFieldStory,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof PhoneFormFieldStory>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    defaultPhone: "+201012345678",
  },
};

export const Required: Story = {
  args: {
    required: true,
  },
};

export const WithError: Story = {
  args: {
    defaultPhone: "+2010123",
    error: true,
    helperText: "Enter a valid phone number",
  },
};
