import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import type { CountryAutocompleteProps } from "@/frontend/mobile/components/ui/input/countrySelect";
import { CountryAutocompleteMobile } from "@/frontend/mobile/components/ui/input/countrySelect/countryAutocomplete.mobile";
import { type CountryType, countries } from "@/frontend/common/lib/locale";

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
