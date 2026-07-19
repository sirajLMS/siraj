import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CountryCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { type CountryType, countries } from "@/frontend/common/lib/locale";
import type { CountrySelectProps } from "@/frontend/mobile/components/ui/input/countrySelect";
import { CountrySelectMobile } from "@/frontend/mobile/components/ui/input/countrySelect/countrySelect.mobile";

function CountrySelectStory({
  initialCountryCode,
  ...props
}: Readonly<Partial<CountrySelectProps> & { initialCountryCode?: CountryCode }>) {
  const [country, setCountry] = useState<CountryType | null | undefined>(() =>
    initialCountryCode ? countries.find(entry => entry.code === initialCountryCode) : undefined
  );

  return (
    <Box sx={{ width: 375, p: 2 }}>
      <CountrySelectMobile country={country} setCountryAction={setCountry} fullWidth {...props} />
    </Box>
  );
}

const meta: Meta<typeof CountrySelectStory> = {
  title: "UI/CountrySelect/Mobile",
  component: CountrySelectStory,
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
