"use client";

import {
  createAutocompletePaperSlotProps,
  createAutocompletePopperSlotProps,
} from "@/frontend/common/components/ui/input/autocompletePopperSlotProps";
import { CurrencyAutocompleteShared } from "@/frontend/common/components/ui/input/currencySelect/CurrencyAutocompleteShared";
import type { CurrencyAutocompleteProps } from "@/frontend/common/components/ui/input/currencySelect/types";
import type { CurrencyOption } from "@/frontend/common/lib/currency";
import { DesktopLocaleEmoji } from "@/frontend/desktop/components/ui/display/localeEmoji";
import { CurrencyOptionRowDesktop } from "@/frontend/desktop/components/ui/input/currencySelect/currencyOptionRow.desktop";

export const CurrencyAutocompleteDesktop: React.FC<CurrencyAutocompleteProps> = (
  props: Readonly<CurrencyAutocompleteProps>
): React.ReactNode => {
  return (
    <CurrencyAutocompleteShared
      {...props}
      LocaleEmojiComponent={DesktopLocaleEmoji}
      CurrencyOptionRowComponent={CurrencyOptionRowDesktop}
      getPopperSlotProps={createAutocompletePopperSlotProps<CurrencyOption>}
      getPaperSlotProps={createAutocompletePaperSlotProps<CurrencyOption>}
      optionRowSx={{ px: 2, py: 1 }}
    />
  );
};
