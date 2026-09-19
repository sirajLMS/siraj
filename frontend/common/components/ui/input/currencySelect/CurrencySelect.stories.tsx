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
import type { CurrencySelectProps } from "@/frontend/common/components/ui/input/currencySelect/types";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { type CurrencyOption, getCurrencyByCode, getCurrencyOptions } from "@/frontend/common/lib/currency";

// Renders the presentational scaffold directly (with the same defaults the
// data-bound CurrencySelect applies in app code) so the story stays Apollo-free.
function CurrencySelectStory({
  initialCurrencyCode,
  setCurrencyAction: _setCurrencyAction,
  ...props
}: Readonly<Partial<CurrencySelectProps> & { initialCurrencyCode?: CurrencyCode }>) {
  const options = getCurrencyOptions();
  const [currency, setCurrency] = useState<CurrencyOption | null>(() =>
    initialCurrencyCode ? (getCurrencyByCode(initialCurrencyCode) ?? null) : null
  );

  return (
    <Box sx={{ width: 400, p: 2 }}>
      <CurrencyAutocompleteShared
        currency={currency}
        onChangeAction={setCurrency}
        matchAnchorWidth
        showSymbol
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

const meta: Meta<typeof CurrencySelectStory> = {
  title: "UI/Input/CurrencySelect",
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
