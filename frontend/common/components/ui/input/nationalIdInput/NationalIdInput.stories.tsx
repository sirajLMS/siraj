import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import {
  NationalIdInput,
  type NationalIdInputProps,
} from "@/frontend/common/components/ui/input/nationalIdInput/NationalIdInput";
import type { NationalIdInputValue } from "@/frontend/common/hooks/useNationalIdInput";

function NationalIdInputStory({
  initialValue = null,
  ...props
}: Readonly<Partial<NationalIdInputProps> & { initialValue?: NationalIdInputValue }>) {
  const [value, setValue] = useState<NationalIdInputValue>(initialValue);

  return (
    <Box sx={{ width: 400, p: 2 }}>
      <NationalIdInput value={value} onChangeAction={setValue} {...props} />
    </Box>
  );
}

const meta: Meta<typeof NationalIdInputStory> = {
  title: "UI/Input/NationalIdInput",
  component: NationalIdInputStory,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof NationalIdInputStory>;

export const EgyptDefault: Story = {
  args: {
    defaultCountry: "EG",
    initialValue: { countryCode: "EG", number: "30001011521216" },
  },
};

export const Saudi: Story = {
  args: {
    defaultCountry: "SA",
    initialValue: { countryCode: "SA", number: "1234567890" },
  },
};

export const Empty: Story = {
  args: {
    defaultCountry: "EG",
  },
};

export const InvalidNumber: Story = {
  args: {
    defaultCountry: "EG",
    initialValue: { countryCode: "EG", number: "12345" },
  },
};

export const Required: Story = {
  args: {
    defaultCountry: "EG",
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    defaultCountry: "EG",
    initialValue: { countryCode: "EG", number: "30001011521216" },
    disabled: true,
  },
};

export const Arabic: Story = {
  globals: {
    locale: "ar",
  },
  args: {
    defaultCountry: "EG",
    initialValue: { countryCode: "EG", number: "30001011521216" },
  },
};
