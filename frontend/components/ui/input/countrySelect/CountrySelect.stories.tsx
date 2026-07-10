import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CountrySelect, type CountrySelectProps } from "@/frontend/components/ui/input/countrySelect/CountrySelect";
import { CountryCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { type CountryType, countries } from "@/frontend/lib/locale";

function CountrySelectStory({
  initialCountryCode,
  ...props
}: Readonly<Partial<CountrySelectProps> & { initialCountryCode?: CountryCode }>) {
  const [country, setCountry] = useState<CountryType | undefined>(() =>
    initialCountryCode ? countries.find(entry => entry.code === initialCountryCode) : undefined
  );

  return (
    <Box sx={{ width: 400, p: 2 }}>
      <CountrySelect country={country} setCountryAction={setCountry} fullWidth {...props} />
    </Box>
  );
}

const meta: Meta<typeof CountrySelectStory> = {
  title: "UI/Input/CountrySelect",
  component: CountrySelectStory,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof CountrySelectStory>;

export const Default: Story = {
  args: {
    initialCountryCode: CountryCode.Sa,
  },
};

export const Empty: Story = {};

export const Required: Story = {
  args: {
    initialCountryCode: CountryCode.Eg,
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    initialCountryCode: CountryCode.Sa,
    disabled: true,
  },
};

export const Arabic: Story = {
  globals: {
    locale: "ar",
  },
  args: {
    initialCountryCode: CountryCode.Sa,
  },
};
