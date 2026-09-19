"use client";

import {
  createAutocompletePaperSlotProps,
  createAutocompletePopperSlotProps,
} from "@/frontend/common/components/ui/input/autocompletePopperSlotProps";
import { CurrencyAutocompleteShared } from "@/frontend/common/components/ui/input/currencySelect/CurrencyAutocompleteShared";
import type { CurrencyAutocompleteProps } from "@/frontend/common/components/ui/input/currencySelect/types";
import { useCurrencyCatalog } from "@/frontend/common/hooks/useCurrencyCatalog";
import type { CurrencyOption } from "@/frontend/common/lib/currency";
import { MobileLocaleEmoji } from "@/frontend/mobile/components/ui/display/localeEmoji";
import { CurrencyOptionRowMobile } from "@/frontend/mobile/components/ui/input/currencySelect/currencyOptionRow.mobile";

export const CurrencyAutocompleteMobile: React.FC<CurrencyAutocompleteProps> = (
  props: Readonly<CurrencyAutocompleteProps>
): React.ReactNode => {
  const { options, loaded } = useCurrencyCatalog();

  return (
    <CurrencyAutocompleteShared
      {...props}
      options={options}
      catalogLoaded={loaded}
      LocaleEmojiComponent={MobileLocaleEmoji}
      CurrencyOptionRowComponent={CurrencyOptionRowMobile}
      getPopperSlotProps={createAutocompletePopperSlotProps<CurrencyOption>}
      getPaperSlotProps={createAutocompletePaperSlotProps<CurrencyOption>}
      optionRowSx={{ px: 2, py: 1.25, minHeight: 48 }}
      fullWidthDefault
    />
  );
};
