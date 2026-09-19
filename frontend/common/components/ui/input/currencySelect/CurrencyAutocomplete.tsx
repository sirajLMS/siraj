"use client";

import { LocaleEmoji } from "@/frontend/common/components/ui/display";
import {
  createAutocompletePaperSlotProps,
  createAutocompletePopperSlotProps,
} from "@/frontend/common/components/ui/input/autocompletePopperSlotProps";
import { CurrencyAutocompleteShared } from "@/frontend/common/components/ui/input/currencySelect/CurrencyAutocompleteShared";
import { CurrencyOptionRow } from "@/frontend/common/components/ui/input/currencySelect/CurrencyOptionRow";
import type { CurrencyAutocompleteProps } from "@/frontend/common/components/ui/input/currencySelect/types";
import { useCurrencyCatalog } from "@/frontend/common/hooks/useCurrencyCatalog";
import type { CurrencyOption } from "@/frontend/common/lib/currency";

export const CurrencyAutocomplete: React.FC<CurrencyAutocompleteProps> = (
  props: Readonly<CurrencyAutocompleteProps>
): React.ReactNode => {
  const { options, loaded } = useCurrencyCatalog();

  return (
    <CurrencyAutocompleteShared
      {...props}
      options={options}
      catalogLoaded={loaded}
      LocaleEmojiComponent={LocaleEmoji}
      CurrencyOptionRowComponent={CurrencyOptionRow}
      getPopperSlotProps={createAutocompletePopperSlotProps<CurrencyOption>}
      getPaperSlotProps={createAutocompletePaperSlotProps<CurrencyOption>}
      optionRowSx={{ px: 2, py: 1 }}
    />
  );
};
