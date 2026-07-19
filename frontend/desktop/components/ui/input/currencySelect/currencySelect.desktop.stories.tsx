import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import type { CurrencySelectProps } from "@/frontend/common/components/ui/input/currencySelect/types";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/common/lib/currency";
import { CurrencySelectDesktop } from "@/frontend/desktop/components/ui/input/currencySelect/currencySelect.desktop";

function CurrencySelectStory({
  initialCurrencyCode,
  ...props
}: Readonly<Partial<CurrencySelectProps> & { initialCurrencyCode?: CurrencyCode }>) {
  const [currency, setCurrency] = useState<CurrencyOption | null>(() =>
    initialCurrencyCode ? (getCurrencyByCode(initialCurrencyCode) ?? null) : null
  );

  return (
    <Box sx={{ width: 400, p: 2 }}>
      <CurrencySelectDesktop currency={currency} setCurrencyAction={setCurrency} fullWidth {...props} />
    </Box>
  );
}

const meta: Meta<typeof CurrencySelectStory> = {
  title: "UI/CurrencySelect/Desktop",
  component: CurrencySelectStory,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof CurrencySelectStory>;

export const Default: Story = {
  args: {
    initialCurrencyCode: CurrencyCode.Eur,
  },
};

export const EgyptianPound: Story = {
  args: {
    initialCurrencyCode: CurrencyCode.Egp,
  },
};

export const Empty: Story = {};

export const Required: Story = {
  args: {
    initialCurrencyCode: CurrencyCode.Sar,
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    initialCurrencyCode: CurrencyCode.Sar,
    disabled: true,
  },
};

export const FilteredToGcc: Story = {
  args: {
    initialCurrencyCode: CurrencyCode.Sar,
    allowedCodes: [
      CurrencyCode.Sar,
      CurrencyCode.Aed,
      CurrencyCode.Kwd,
      CurrencyCode.Qar,
      CurrencyCode.Bhd,
      CurrencyCode.Omr,
    ],
  },
};

export const Arabic: Story = {
  globals: {
    locale: "ar",
  },
  args: {
    initialCurrencyCode: CurrencyCode.Sar,
  },
};
