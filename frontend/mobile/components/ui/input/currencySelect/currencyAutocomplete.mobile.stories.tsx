import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import type { CurrencyAutocompleteProps } from "@/frontend/common/components/ui/input/currencySelect/types";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/common/lib/currency";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { CurrencyAutocompleteMobile } from "@/frontend/mobile/components/ui/input/currencySelect/currencyAutocomplete.mobile";

function CurrencyAutocompleteStory({
  initialCurrencyCode,
  onChangeAction: _onChangeAction,
  ...props
}: Readonly<Partial<CurrencyAutocompleteProps> & { initialCurrencyCode?: CurrencyCode }>) {
  const [currency, setCurrency] = useState<CurrencyOption | null>(() =>
    initialCurrencyCode ? (getCurrencyByCode(initialCurrencyCode) ?? null) : null
  );

  return (
    <Box sx={{ width: 400, p: 2 }}>
      <CurrencyAutocompleteMobile currency={currency} onChangeAction={setCurrency} fullWidth {...props} />
    </Box>
  );
}

const meta: Meta<typeof CurrencyAutocompleteStory> = {
  title: "UI/CurrencyAutocomplete/Mobile",
  component: CurrencyAutocompleteStory,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
    },
  },
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

export const OpenDropdown: Story = {
  args: {
    initialCurrencyCode: CurrencyCode.Sar,
    open: true,
  },
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  args: {
    initialCurrencyCode: CurrencyCode.Sar,
  },
};
