import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useForm } from "react-hook-form";
import { PhoneFormFieldMobile } from "@/frontend/mobile/components/ui/input/phoneInput/phoneFormField.mobile";

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
    <Box sx={{ width: "100%", maxWidth: 375, p: 2 }}>
      <PhoneFormFieldMobile
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
  title: "UI/PhoneFormField/Mobile",
  component: PhoneFormFieldStory,
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
