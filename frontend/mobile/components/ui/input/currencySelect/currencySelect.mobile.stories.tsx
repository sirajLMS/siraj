import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import {
  createAutocompletePaperSlotProps,
  createAutocompletePopperSlotProps,
} from "@/frontend/common/components/ui/input/autocompletePopperSlotProps";
import { CurrencyAutocompleteShared } from "@/frontend/common/components/ui/input/currencySelect/CurrencyAutocompleteShared";
import type { CurrencySelectProps } from "@/frontend/common/components/ui/input/currencySelect/types";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { type CurrencyOption, getCurrencyByCode, getCurrencyOptions } from "@/frontend/common/lib/currency";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { MobileLocaleEmoji } from "@/frontend/mobile/components/ui/display/localeEmoji";
import { CurrencyOptionRowMobile } from "@/frontend/mobile/components/ui/input/currencySelect/currencyOptionRow.mobile";

// Renders the presentational scaffold with the mobile slots (and the same
// defaults the data-bound CurrencySelectMobile applies) plus a static
// catalog so the story stays Apollo-free.
function CurrencySelectStory({
  initialCurrencyCode,
  setCurrencyAction: _setCurrencyAction,
  ...props
}: Readonly<Partial<CurrencySelectProps> & { initialCurrencyCode?: CurrencyCode }>) {
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
        options={getCurrencyOptions()}
        catalogLoaded
        fullWidth
        LocaleEmojiComponent={MobileLocaleEmoji}
        CurrencyOptionRowComponent={CurrencyOptionRowMobile}
        getPopperSlotProps={createAutocompletePopperSlotProps<CurrencyOption>}
        getPaperSlotProps={createAutocompletePaperSlotProps<CurrencyOption>}
        optionRowSx={{ px: 2, py: 1.25, minHeight: 48 }}
        fullWidthDefault
        {...props}
      />
    </Box>
  );
}

const meta: Meta<typeof CurrencySelectStory> = {
  title: "UI/CurrencySelect/Mobile",
  component: CurrencySelectStory,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
    },
  },
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
