"use client";

import Box from "@mui/material/Box";
import type * as React from "react";
import type { CountryOptionRowProps } from "@/frontend/common/components/ui/input/countrySelect/countryOptionRow.types";
import { getCountryDisplayName } from "@/frontend/common/lib/locale";
import { MobileLocaleEmoji } from "@/frontend/mobile/components/ui/display/localeEmoji/localeEmoji.mobile";

export function CountryOptionRowMobile({
  country,
  locale,
  showPhonePrefix = true,
}: CountryOptionRowProps): React.ReactNode {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%", minHeight: 44, py: 1 }}>
      <MobileLocaleEmoji emoji={country.emoji} />
      <Box component="span" sx={{ flex: 1 }}>
        {getCountryDisplayName(country.code, locale)}
      </Box>
      {showPhonePrefix ? (
        <Box
          component="span"
          dir="ltr"
          sx={theme => ({ color: theme.palette.text.secondary, flexShrink: 0, fontSize: "0.95rem" })}
        >
          +{country.phone}
        </Box>
      ) : null}
    </Box>
  );
}
