"use client";

import type * as React from "react";
import { CountryAutocompleteShared } from "@/frontend/common/components/ui/input/countrySelect/CountryAutocompleteShared";
import type { CountryAutocompleteProps } from "@/frontend/common/components/ui/input/countrySelect/types";
import { DesktopLocaleEmoji } from "@/frontend/desktop/components/ui/display/localeEmoji";
import { CountryOptionRowDesktop } from "@/frontend/desktop/components/ui/input/countrySelect/countryOptionRow.desktop";

const DESKTOP_OPTION_BOX_SX = { px: 2, py: 1 } as const;

export const CountryAutocompleteDesktop: React.FC<CountryAutocompleteProps> = (props): React.ReactNode => {
  return (
    <CountryAutocompleteShared
      {...props}
      slots={{
        LocaleEmoji: DesktopLocaleEmoji,
        CountryOptionRow: CountryOptionRowDesktop,
        optionBoxSx: DESKTOP_OPTION_BOX_SX,
      }}
    />
  );
};
