import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import {
  createAutocompletePaperSlotProps,
  createAutocompletePopperSlotProps,
} from "@/frontend/common/components/ui/input/autocompletePopperSlotProps";
import { CurrencyAutocompleteShared } from "@/frontend/common/components/ui/input/currencySelect/CurrencyAutocompleteShared";
import type { CurrencyAutocompleteProps } from "@/frontend/common/components/ui/input/currencySelect/types";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { type CurrencyOption, getCurrencyByCode, getCurrencyOptions } from "@/frontend/common/lib/currency";
import { DesktopLocaleEmoji } from "@/frontend/desktop/components/ui/display/localeEmoji";
import { CurrencyOptionRowDesktop } from "@/frontend/desktop/components/ui/input/currencySelect/currencyOptionRow.desktop";

// Renders the presentational scaffold with the desktop slots and a static
// catalog so the story stays Apollo-free (the data-bound
// CurrencyAutocompleteDesktop lives in app code).
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
      <CurrencyAutocompleteShared
        currency={currency}
        onChangeAction={setCurrency}
        options={getCurrencyOptions()}
        catalogLoaded
        fullWidth
        LocaleEmojiComponent={DesktopLocaleEmoji}
        CurrencyOptionRowComponent={CurrencyOptionRowDesktop}
        getPopperSlotProps={createAutocompletePopperSlotProps<CurrencyOption>}
        getPaperSlotProps={createAutocompletePaperSlotProps<CurrencyOption>}
        optionRowSx={{ px: 2, py: 1 }}
        {...props}
      />
    </Box>
  );
}

const meta: Meta<typeof CurrencyAutocompleteStory> = {
  title: "UI/CurrencyAutocomplete/Desktop",
  component: CurrencyAutocompleteStory,
  tags: ["ai-generated"],
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
