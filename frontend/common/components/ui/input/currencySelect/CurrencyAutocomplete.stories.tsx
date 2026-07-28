import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { CurrencyAutocomplete } from "@/frontend/common/components/ui/input/currencySelect/CurrencyAutocomplete";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { type CurrencyOption, getCurrencyOptions } from "@/frontend/common/lib/currency";

function CurrencyAutocompleteStory({
  initialCurrencyCode,
  onChangeAction: _onChangeAction,
  ...props
}: Readonly<React.ComponentProps<typeof CurrencyAutocomplete> & { initialCurrencyCode?: CurrencyCode }>) {
  const options = getCurrencyOptions();
  const [currency, setCurrency] = useState<CurrencyOption | null>(() =>
    initialCurrencyCode ? (options.find(option => option.code === initialCurrencyCode) ?? null) : null
  );

  return (
    <Box sx={{ width: 400, p: 2 }}>
      <CurrencyAutocomplete currency={currency} onChangeAction={setCurrency} fullWidth {...props} />
    </Box>
  );
}

const meta: Meta<typeof CurrencyAutocompleteStory> = {
  title: "UI/Input/CurrencyAutocomplete",
  component: CurrencyAutocompleteStory,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CurrencyAutocompleteStory>;

export const Default: Story = {
  args: {
    initialCurrencyCode: CurrencyCode.Sar,
  },
};

export const Empty: Story = {};

export const Required: Story = {
  args: {
    initialCurrencyCode: CurrencyCode.Egp,
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    initialCurrencyCode: CurrencyCode.Sar,
    disabled: true,
  },
};

export const WithoutSymbol: Story = {
  args: {
    initialCurrencyCode: CurrencyCode.Usd,
    showSymbol: false,
  },
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  args: {
    initialCurrencyCode: CurrencyCode.Sar,
  },
};
