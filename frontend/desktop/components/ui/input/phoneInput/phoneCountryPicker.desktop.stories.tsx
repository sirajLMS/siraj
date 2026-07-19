import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { type CountryType, countries } from "@/frontend/common/lib/locale";
import {
  PhoneCountryPickerDesktop,
  type PhoneCountryPickerDesktopProps,
} from "@/frontend/desktop/components/ui/input/phoneInput/phoneCountryPicker.desktop";

function PhoneCountryPickerStory({
  initialCountryCode = "EG",
  onSelectAction: _onSelectAction,
  ...props
}: Readonly<
  Partial<PhoneCountryPickerDesktopProps> & {
    initialCountryCode?: string;
  }
>) {
  const [country, setCountry] = useState<CountryType | undefined>(() =>
    countries.find(entry => entry.code === initialCountryCode)
  );

  return (
    <Box sx={{ width: 400, p: 2 }}>
      <Box sx={{ position: "relative", minHeight: 320 }}>
        <PhoneCountryPickerDesktop country={country} onSelectAction={setCountry} {...props} />
      </Box>
    </Box>
  );
}

const meta: Meta<typeof PhoneCountryPickerStory> = {
  title: "UI/PhoneCountryPicker/Desktop",
  component: PhoneCountryPickerStory,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof PhoneCountryPickerStory>;

export const Default: Story = {
  args: {
    initialCountryCode: "EG",
  },
};

export const Saudi: Story = {
  args: {
    initialCountryCode: "SA",
  },
};

export const Arabic: Story = {
  globals: {
    locale: "ar",
  },
  args: {
    initialCountryCode: "EG",
  },
};
