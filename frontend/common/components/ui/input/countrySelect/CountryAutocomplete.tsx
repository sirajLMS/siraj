"use client";

import type * as React from "react";
import { LocaleEmoji } from "@/frontend/common/components/ui/display";
import { CountryAutocompleteShared } from "@/frontend/common/components/ui/input/countrySelect/CountryAutocompleteShared";
import { CountryOptionRow } from "@/frontend/common/components/ui/input/countrySelect/CountryOptionRow";
import type { CountryAutocompleteProps } from "@/frontend/common/components/ui/input/countrySelect/types";

const COMMON_OPTION_BOX_SX = { px: 2, py: 1 } as const;

export const CountryAutocomplete: React.FC<CountryAutocompleteProps> = (props): React.ReactNode => {
  return (
    <CountryAutocompleteShared
      {...props}
      slots={{
        LocaleEmoji,
        CountryOptionRow,
        optionBoxSx: COMMON_OPTION_BOX_SX,
      }}
    />
  );
};
