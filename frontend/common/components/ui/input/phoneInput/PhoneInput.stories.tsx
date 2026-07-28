import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { PhoneInput, type PhoneInputProps } from "@/frontend/common/components/ui/input/phoneInput/PhoneInput";

function PhoneInputStory({
  initialValue = null,
  ...props
}: Readonly<Partial<PhoneInputProps> & { initialValue?: string | null }>) {
  const [value, setValue] = useState<string | null>(initialValue);

  return (
    <Box sx={{ width: 400, p: 2 }}>
      <PhoneInput value={value} onChangeAction={setValue} {...props} />
    </Box>
  );
}

const meta: Meta<typeof PhoneInputStory> = {
  title: "UI/Input/PhoneInput",
  component: PhoneInputStory,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof PhoneInputStory>;

export const EgyptDefault: Story = {
  args: {
    defaultRegion: "EG",
    initialValue: "+201012345678",
  },
};

export const Saudi: Story = {
  args: {
    defaultRegion: "SA",
    initialValue: "+966501234567",
  },
};

export const Empty: Story = {
  args: {
    defaultRegion: "EG",
  },
};

export const InvalidPrefix: Story = {
  args: {
    defaultRegion: "EG",
    initialValue: "+999",
  },
};

export const InvalidNumber: Story = {
  args: {
    defaultRegion: "EG",
    initialValue: "+2010123",
  },
};

export const Required: Story = {
  args: {
    defaultRegion: "EG",
    required: true,
  },
};

export const Arabic: Story = {
  globals: {
    locale: "ar",
  },
  args: {
    defaultRegion: "EG",
    initialValue: "+201012345678",
  },
};
