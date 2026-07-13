"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import { LocaleEmoji } from "@/frontend/components/ui/display";
import { type CountryType, getCountryDisplayName } from "@/frontend/common/lib/locale";

export type CountryOptionRowProps = {
  readonly country: CountryType;
  readonly locale: string;
  readonly showPhonePrefix?: boolean;
};

export function CountryOptionRow({ country, locale, showPhonePrefix = true }: CountryOptionRowProps): React.ReactNode {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
      <LocaleEmoji emoji={country.emoji} />
      <Typography component="span" sx={{ flex: 1 }}>
        {getCountryDisplayName(country.code, locale)}
      </Typography>
      {showPhonePrefix ? (
        <Typography component="span" dir="ltr" sx={{ color: "text.secondary", flexShrink: 0 }}>
          +{country.phone}
        </Typography>
      ) : null}
    </Box>
  );
}

export function getCountryOptionLabel(country: CountryType, locale: string, showPhonePrefix = true): string {
  const name = getCountryDisplayName(country.code, locale);
  if (!showPhonePrefix) {
    return name;
  }
  return `${name} (+${country.phone})`;
}
