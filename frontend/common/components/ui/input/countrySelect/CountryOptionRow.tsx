"use client";

import Box from "@mui/material/Box";
import type * as React from "react";
import { LocaleEmoji } from "@/frontend/common/components/ui/display";
import type { CountryOptionRowProps } from "@/frontend/common/components/ui/input/countrySelect/countryOptionRow.types";
import { getCountryDisplayName } from "@/frontend/common/lib/locale";

export function CountryOptionRow({
  country,
  locale,
  showPhonePrefix = true,
  EmojiComponent = LocaleEmoji,
}: CountryOptionRowProps): React.ReactNode {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
      <EmojiComponent emoji={country.emoji} />
      <Box component="span" sx={{ flex: 1 }}>
        {getCountryDisplayName(country.code, locale)}
      </Box>
      {showPhonePrefix ? (
        <Box component="span" sx={theme => ({ color: theme.palette.text.secondary, flexShrink: 0, direction: "ltr" })}>
          +{country.phone}
        </Box>
      ) : null}
    </Box>
  );
}
