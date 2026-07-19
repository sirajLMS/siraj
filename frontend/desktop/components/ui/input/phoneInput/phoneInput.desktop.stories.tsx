import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  PhoneInputDesktop,
  type PhoneInputProps,
} from "@/frontend/desktop/components/ui/input/phoneInput/phoneInput.desktop";

function PhoneInputStory({
  initialValue = null,
  ...props
}: Readonly<Partial<PhoneInputProps> & { initialValue?: string | null }>) {
  const [value, setValue] = useState<string | null>(initialValue);

  return (
    <Box sx={{ width: 400, p: 2 }}>
      <PhoneInputDesktop value={value} onChangeAction={setValue} {...props} />
    </Box>
  );
}

const meta: Meta<typeof PhoneInputStory> = {
  title: "UI/PhoneInput/Desktop",
  component: PhoneInputStory,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof PhoneInputStory>;

export const Default: Story = {
  args: {
    defaultRegion: "EG",
    initialValue: "+201012345678",
  },
};

export const Empty: Story = {
  args: {
    defaultRegion: "EG",
  },
};

export const InvalidNumber: Story = {
  args: {
    defaultRegion: "EG",
    initialValue: "+2010123",
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
