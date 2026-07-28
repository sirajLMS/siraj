import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { type CountryType, countries } from "@/frontend/common/lib/locale";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import type { CountryAutocompleteProps } from "@/frontend/mobile/components/ui/input/countrySelect";
import { CountryAutocompleteMobile } from "@/frontend/mobile/components/ui/input/countrySelect/countryAutocomplete.mobile";

function CountryAutocompleteStory({
  initialCountryCode,
  onChangeAction: _onChangeAction,
  ...props
}: Readonly<Partial<CountryAutocompleteProps> & { initialCountryCode?: string }>) {
  const [country, setCountry] = useState<CountryType | undefined>(() =>
    initialCountryCode ? countries.find(entry => entry.code === initialCountryCode) : undefined
  );

  return (
    <Box sx={{ width: 375, p: 2 }}>
      <CountryAutocompleteMobile country={country} onChangeAction={setCountry} fullWidth {...props} />
    </Box>
  );
}

const meta: Meta<typeof CountryAutocompleteStory> = {
  title: "UI/CountryAutocomplete/Mobile",
  component: CountryAutocompleteStory,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
    },
  },
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
