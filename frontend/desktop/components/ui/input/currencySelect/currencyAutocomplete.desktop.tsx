"use client";

import { CurrencyAutocompleteShared } from "@/frontend/common/components/ui/input/currencySelect/CurrencyAutocompleteShared";
import type { CurrencyAutocompleteProps } from "@/frontend/common/components/ui/input/currencySelect/types";
import { DesktopLocaleEmoji } from "@/frontend/desktop/components/ui/display/localeEmoji";
import {
  getCurrencyAutocompletePaperSlotPropsDesktop,
  getCurrencyAutocompletePopperSlotPropsDesktop,
} from "@/frontend/desktop/components/ui/input/currencySelect/currencyAutocompletePopper";
import { CurrencyOptionRowDesktop } from "@/frontend/desktop/components/ui/input/currencySelect/currencyOptionRow.desktop";

export const CurrencyAutocompleteDesktop: React.FC<CurrencyAutocompleteProps> = (
  props: Readonly<CurrencyAutocompleteProps>
): React.ReactNode => {
  return (
    <CurrencyAutocompleteShared
      {...props}
      LocaleEmojiComponent={DesktopLocaleEmoji}
      CurrencyOptionRowComponent={CurrencyOptionRowDesktop}
      getPopperSlotProps={getCurrencyAutocompletePopperSlotPropsDesktop}
      getPaperSlotProps={getCurrencyAutocompletePaperSlotPropsDesktop}
      optionRowSx={{ px: 2, py: 1 }}
    />
  );
};
