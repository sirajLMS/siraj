"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import { MobileLocaleEmoji } from "@/frontend/mobile/components/ui/display/localeEmoji/localeEmoji.mobile";
import { type CountryType, getCountryDisplayName } from "@/frontend/common/lib/locale";

export type CountryOptionRowProps = {
  readonly country: CountryType;
  readonly locale: string;
  readonly showPhonePrefix?: boolean;
};

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