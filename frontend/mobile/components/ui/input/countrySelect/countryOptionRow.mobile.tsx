"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
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
      <Typography component="span" sx={{ flex: 1 }}>
        {getCountryDisplayName(country.code, locale)}
      </Typography>
      {showPhonePrefix ? (
        <Typography component="span" dir="ltr" sx={{ color: "text.secondary", flexShrink: 0, fontSize: "0.95rem" }}>
          +{country.phone}
        </Typography>
      ) : null}
    </Box>
  );
}
