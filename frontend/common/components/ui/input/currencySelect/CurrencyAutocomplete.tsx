"use client";

import { LocaleEmoji } from "@/frontend/common/components/ui/display";
import { CurrencyAutocompleteShared } from "@/frontend/common/components/ui/input/currencySelect/CurrencyAutocompleteShared";
import { CurrencyOptionRow } from "@/frontend/common/components/ui/input/currencySelect/CurrencyOptionRow";
import {
  getCurrencyAutocompletePaperSlotProps,
  getCurrencyAutocompletePopperSlotProps,
} from "@/frontend/common/components/ui/input/currencySelect/currencyAutocompletePopper";
import type { CurrencyAutocompleteProps } from "@/frontend/common/components/ui/input/currencySelect/types";

export const CurrencyAutocomplete: React.FC<CurrencyAutocompleteProps> = (
  props: Readonly<CurrencyAutocompleteProps>
): React.ReactNode => {
  return (
    <CurrencyAutocompleteShared
      {...props}
      LocaleEmojiComponent={LocaleEmoji}
      CurrencyOptionRowComponent={CurrencyOptionRow}
      getPopperSlotProps={getCurrencyAutocompletePopperSlotProps}
      getPaperSlotProps={getCurrencyAutocompletePaperSlotProps}
      optionRowSx={{ px: 2, py: 1 }}
    />
  );
};
