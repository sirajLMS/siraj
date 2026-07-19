import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import type { CountryAutocompleteProps } from "@/frontend/common/components/ui/input/countrySelect/types";
import { type CountryType, countries } from "@/frontend/common/lib/locale";
import { CountryAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/countrySelect/countryAutocomplete.desktop";

function CountryAutocompleteStory({
  initialCountryCode,
  onChangeAction: _onChangeAction,
  ...props
}: Readonly<Partial<CountryAutocompleteProps> & { initialCountryCode?: string }>) {
  const [country, setCountry] = useState<CountryType | undefined>(() =>
    initialCountryCode ? countries.find(entry => entry.code === initialCountryCode) : undefined
  );

  return (
    <Box sx={{ width: 400, p: 2 }}>
      <CountryAutocompleteDesktop country={country} onChangeAction={setCountry} fullWidth {...props} />
    </Box>
  );
}

const meta: Meta<typeof CountryAutocompleteStory> = {
  title: "UI/CountryAutocomplete/Desktop",
  component: CountryAutocompleteStory,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof CountryAutocompleteStory>;

export const Default: Story = {
  args: {
    initialCountryCode: "SA",
  },
};

export const Empty: Story = {};

export const Required: Story = {
  args: {
    initialCountryCode: "EG",
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    initialCountryCode: "SA",
    disabled: true,
  },
};

export const WithoutPhonePrefix: Story = {
  args: {
    initialCountryCode: "AE",
    showPhonePrefix: false,
  },
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  args: {
    initialCountryCode: "SA",
  },
};
