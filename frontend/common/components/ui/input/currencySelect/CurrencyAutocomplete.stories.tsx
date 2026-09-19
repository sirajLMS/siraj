import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { LocaleEmoji } from "@/frontend/common/components/ui/display";
import {
  createAutocompletePaperSlotProps,
  createAutocompletePopperSlotProps,
} from "@/frontend/common/components/ui/input/autocompletePopperSlotProps";
import { CurrencyAutocompleteShared } from "@/frontend/common/components/ui/input/currencySelect/CurrencyAutocompleteShared";
import { CurrencyOptionRow } from "@/frontend/common/components/ui/input/currencySelect/CurrencyOptionRow";
import type { CurrencyAutocompleteProps } from "@/frontend/common/components/ui/input/currencySelect/types";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { type CurrencyOption, getCurrencyOptions } from "@/frontend/common/lib/currency";

// Renders the presentational scaffold directly with a static catalog so the
// story stays Apollo-free (the data-bound CurrencyAutocomplete wrapper lives in app code).
function CurrencyAutocompleteStory({
  initialCurrencyCode,
  onChangeAction: _onChangeAction,
  ...props
}: Readonly<CurrencyAutocompleteProps & { initialCurrencyCode?: CurrencyCode }>) {
  const options = getCurrencyOptions();
  const [currency, setCurrency] = useState<CurrencyOption | null>(() =>
    initialCurrencyCode ? (options.find(option => option.code === initialCurrencyCode) ?? null) : null
  );

  return (
    <Box sx={{ width: 400, p: 2 }}>
      <CurrencyAutocompleteShared
        currency={currency}
        onChangeAction={setCurrency}
        options={options}
        catalogLoaded
        fullWidth
        LocaleEmojiComponent={LocaleEmoji}
        CurrencyOptionRowComponent={CurrencyOptionRow}
        getPopperSlotProps={createAutocompletePopperSlotProps<CurrencyOption>}
        getPaperSlotProps={createAutocompletePaperSlotProps<CurrencyOption>}
        optionRowSx={{ px: 2, py: 1 }}
        {...props}
      />
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
