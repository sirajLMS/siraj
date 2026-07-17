"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import { getCountryDisplayName } from "@/frontend/common/lib/locale";
import { DesktopLocaleEmoji } from "@/frontend/desktop/components/ui/display/localeEmoji";

export type CountryOptionRowProps = {
  readonly country: { readonly code: string; readonly emoji: string; readonly phone: string };
  readonly locale: string;
  readonly showPhonePrefix?: boolean;
};

export function CountryOptionRowDesktop({
  country,
  locale,
  showPhonePrefix = true,
}: CountryOptionRowProps): React.ReactNode {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
      <DesktopLocaleEmoji emoji={country.emoji} />
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
