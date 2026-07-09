import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CurrencySelect, type CurrencySelectProps } from "@/frontend/components/ui/input/currencySelect/CurrencySelect";
import type { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/lib/currency";

function CurrencySelectStory({
  initialCurrencyCode,
  ...props
}: Readonly<Partial<CurrencySelectProps> & { initialCurrencyCode?: CurrencyCode }>) {
  const [currency, setCurrency] = useState<CurrencyOption | null>(() =>
    initialCurrencyCode ? (getCurrencyByCode(initialCurrencyCode) ?? null) : null
  );

  return (
    <Box sx={{ width: 400, p: 2 }}>
      <CurrencySelect currency={currency} setCurrencyAction={setCurrency} fullWidth {...props} />
    </Box>
  );
}

const meta: Meta<typeof CurrencySelectStory> = {
  title: "UI/Input/CurrencySelect",
  component: CurrencySelectStory,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof CurrencySelectStory>;

export const Default: Story = {
  args: {
    initialCurrencyCode: "EUR",
  },
};

export const EgyptianPound: Story = {
  args: {
    initialCurrencyCode: "EGP",
  },
};

export const Empty: Story = {};

export const Required: Story = {
  args: {
    initialCurrencyCode: "SAR",
    required: true,
  },
};

export const FilteredToGcc: Story = {
  args: {
    initialCurrencyCode: "SAR",
    allowedCodes: ["SAR", "AED", "KWD", "QAR", "BHD", "OMR", "QAR"],
  },
};

export const Arabic: Story = {
  globals: {
    locale: "ar",
  },
  args: {
    initialCurrencyCode: "SAR",
  },
};
