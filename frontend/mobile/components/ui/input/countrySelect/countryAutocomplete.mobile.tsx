"use client";

import type * as React from "react";
import { CountryAutocompleteShared } from "@/frontend/common/components/ui/input/countrySelect/CountryAutocompleteShared";
import type { CountryAutocompleteProps } from "@/frontend/common/components/ui/input/countrySelect/types";
import { MobileLocaleEmoji } from "@/frontend/mobile/components/ui/display/localeEmoji";
import { CountryOptionRowMobile } from "@/frontend/mobile/components/ui/input/countrySelect/countryOptionRow.mobile";

const MOBILE_OPTION_BOX_SX = { py: 1.25, minHeight: 48 } as const;

export const CountryAutocompleteMobile: React.FC<CountryAutocompleteProps> = (props): React.ReactNode => {
  return (
    <CountryAutocompleteShared
      {...props}
      slots={{
        LocaleEmoji: MobileLocaleEmoji,
        CountryOptionRow: CountryOptionRowMobile,
        optionBoxSx: MOBILE_OPTION_BOX_SX,
      }}
    />
  );
};
