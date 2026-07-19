import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { type CountryType, countries } from "@/frontend/common/lib/locale";
import {
  PhoneCountryPickerMobile,
  type PhoneCountryPickerMobileProps,
} from "@/frontend/mobile/components/ui/input/phoneInput/phoneCountryPicker.mobile";

function PhoneCountryPickerStory({
  initialCountryCode = "EG",
  onSelectAction: _onSelectAction,
  ...props
}: Readonly<
  Partial<PhoneCountryPickerMobileProps> & {
    initialCountryCode?: string;
  }
>) {
  const [country, setCountry] = useState<CountryType | undefined>(() =>
    countries.find(entry => entry.code === initialCountryCode)
  );

  return (
    <Box sx={{ width: "100%", maxWidth: 375, p: 2 }}>
      <Box sx={{ position: "relative", minHeight: 320 }}>
        <PhoneCountryPickerMobile country={country} onSelectAction={setCountry} {...props} />
      </Box>
    </Box>
  );
}

const meta: Meta<typeof PhoneCountryPickerStory> = {
  title: "UI/PhoneCountryPicker/Mobile",
  component: PhoneCountryPickerStory,
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
