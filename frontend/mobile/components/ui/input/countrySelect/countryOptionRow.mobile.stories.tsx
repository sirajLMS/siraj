import { Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { CountryOptionRowMobile } from "@/frontend/mobile/components/ui/input/countrySelect/countryOptionRow.mobile";
import { countries } from "@/frontend/common/lib/locale";

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
