"use client";

import { CurrencyAutocompleteShared } from "@/frontend/common/components/ui/input/currencySelect/CurrencyAutocompleteShared";
import type { CurrencyAutocompleteProps } from "@/frontend/common/components/ui/input/currencySelect/types";
import { MobileLocaleEmoji } from "@/frontend/mobile/components/ui/display/localeEmoji";
import {
  getCurrencyAutocompletePaperSlotProps,
  getCurrencyAutocompletePopperSlotProps,
} from "@/frontend/mobile/components/ui/input/currencySelect/currencyAutocompletePopper";
import { CurrencyOptionRowMobile } from "@/frontend/mobile/components/ui/input/currencySelect/currencyOptionRow.mobile";

export const CurrencyAutocompleteMobile: React.FC<CurrencyAutocompleteProps> = (
  props: Readonly<CurrencyAutocompleteProps>
): React.ReactNode => {
  return (
    <CurrencyAutocompleteShared
      {...props}
      LocaleEmojiComponent={MobileLocaleEmoji}
      CurrencyOptionRowComponent={CurrencyOptionRowMobile}
      getPopperSlotProps={getCurrencyAutocompletePopperSlotProps}
      getPaperSlotProps={getCurrencyAutocompletePaperSlotProps}
      optionRowSx={{ px: 2, py: 1.25, minHeight: 48 }}
      fullWidthDefault
    />
  );
};
