import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  PhoneInput,
  type PhoneInputProps,
} from "@/frontend/mobile/components/ui/input/phoneInput/PhoneInput";

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
