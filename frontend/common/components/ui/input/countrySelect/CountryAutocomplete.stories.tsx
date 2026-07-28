import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { CountryAutocomplete } from "@/frontend/common/components/ui/input/countrySelect/CountryAutocomplete";
import { type CountryType, countries } from "@/frontend/common/lib/locale";

function CountryAutocompleteStory({
  initialCountryCode,
  onChangeAction: _onChangeAction,
  ...props
}: Readonly<React.ComponentProps<typeof CountryAutocomplete> & { initialCountryCode?: string }>) {
  const [country, setCountry] = useState<CountryType | undefined>(() =>
    initialCountryCode ? countries.find(entry => entry.code === initialCountryCode) : undefined
  );

  return (
    <Box sx={{ width: 400, p: 2 }}>
      <CountryAutocomplete country={country} onChangeAction={setCountry} fullWidth {...props} />
    </Box>
  );
}

const meta: Meta<typeof CountryAutocompleteStory> = {
  title: "UI/Input/CountryAutocomplete",
  component: CountryAutocompleteStory,
  tags: ["autodocs"],
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
