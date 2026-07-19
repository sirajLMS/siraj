import { Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { countries } from "@/frontend/common/lib/locale";
import { CountryOptionRowDesktop } from "@/frontend/desktop/components/ui/input/countrySelect/countryOptionRow.desktop";

const sampleCountries = ["SA", "EG", "AE", "US"].flatMap(code => {
  const country = countries.find(entry => entry.code === code);
  return country ? [country] : [];
});

interface CountryOptionRowListProps {
  readonly locale: string;
  readonly showPhonePrefix?: boolean;
}

function CountryOptionRowList({ locale, showPhonePrefix = true }: CountryOptionRowListProps) {
  return (
    <Stack sx={{ width: 400, p: 2 }} spacing={0}>
      {sampleCountries.map(country => (
        <CountryOptionRowDesktop
          key={country.code}
          country={country}
          locale={locale}
          showPhonePrefix={showPhonePrefix}
        />
      ))}
    </Stack>
  );
}

const meta: Meta<typeof CountryOptionRowList> = {
  title: "UI/CountryOptionRow/Desktop",
  component: CountryOptionRowList,
  tags: ["ai-generated"],
  args: {
    locale: "en",
    showPhonePrefix: true,
  },
};

export default meta;
type Story = StoryObj<typeof CountryOptionRowList>;

export const Default: Story = {};

export const WithoutPhonePrefix: Story = {
  args: {
    showPhonePrefix: false,
  },
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  args: {
    locale: "ar",
  },
};
