"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import type { CurrencyOptionRowProps } from "@/frontend/common/components/ui/input/currencySelect/currencyOptionRow.types";
import { getCurrencyDisplayName } from "@/frontend/common/lib/currency";
import { DesktopLocaleEmoji } from "@/frontend/desktop/components/ui/display/localeEmoji";

export function CurrencyOptionRowDesktop({
  currency,
  locale,
  showSymbol = true,
}: CurrencyOptionRowProps): React.ReactNode {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
      <DesktopLocaleEmoji emoji={currency.flagEmoji} />
      <Typography component="span" sx={{ flex: 1 }}>
        {getCurrencyDisplayName(currency.code, locale)}
      </Typography>
      {showSymbol ? (
        <Typography component="span" dir="ltr" sx={theme => ({ color: theme.palette.text.secondary, flexShrink: 0 })}>
          {currency.symbol}
        </Typography>
      ) : null}
      <Typography component="span" dir="ltr" sx={theme => ({ color: theme.palette.text.secondary, flexShrink: 0 })}>
        {currency.code as string}
      </Typography>
    </Box>
  );
}
