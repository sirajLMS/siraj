import { Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { countries } from "@/frontend/common/lib/locale";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { CountryOptionRowMobile } from "@/frontend/mobile/components/ui/input/countrySelect/countryOptionRow.mobile";

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
    <Stack sx={{ width: 375, p: 2 }} spacing={0}>
      {sampleCountries.map(country => (
        <CountryOptionRowMobile
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
  title: "UI/CountryOptionRow/Mobile",
  component: CountryOptionRowList,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
    },
  },
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
