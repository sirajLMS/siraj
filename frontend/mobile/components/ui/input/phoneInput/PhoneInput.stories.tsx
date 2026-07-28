import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { PhoneInput, type PhoneInputProps } from "@/frontend/mobile/components/ui/input/phoneInput/PhoneInput";

function PhoneInputStory({
  initialValue = null,
  ...props
}: Readonly<Partial<PhoneInputProps> & { initialValue?: string | null }>) {
  const [value, setValue] = useState<string | null>(initialValue);

  return (
    <Box sx={{ width: "100%", maxWidth: 375, p: 2 }}>
      <PhoneInput value={value} onChangeAction={setValue} {...props} />
    </Box>
  );
}

const meta: Meta<typeof PhoneInputStory> = {
  title: "UI/PhoneInput/Mobile",
  component: PhoneInputStory,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
    },
  },
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
