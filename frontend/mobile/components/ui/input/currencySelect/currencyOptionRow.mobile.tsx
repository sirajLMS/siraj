"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import { type CurrencyOption, getCurrencyDisplayName } from "@/frontend/common/lib/currency";
import { MobileLocaleEmoji } from "@/frontend/mobile/components/ui/display/localeEmoji";

export type CurrencyOptionRowProps = {
  readonly currency: CurrencyOption;
  readonly locale: string;
  readonly showSymbol?: boolean;
};

export function CurrencyOptionRowMobile({
  currency,
  locale,
  showSymbol = true,
}: CurrencyOptionRowProps): React.ReactNode {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: "100%", minHeight: 44 }}>
      <MobileLocaleEmoji emoji={currency.flagEmoji} />
      <Typography component="span" sx={{ flex: 1, fontSize: "1rem" }}>
        {getCurrencyDisplayName(currency.code, locale)}
      </Typography>
      {showSymbol ? (
        <Typography
          component="span"
          dir="ltr"
          sx={theme => ({ color: theme.palette.text.secondary, flexShrink: 0, fontSize: "0.9rem" })}
        >
          {currency.symbol}
        </Typography>
      ) : null}
      <Typography
        component="span"
        dir="ltr"
        sx={theme => ({ color: theme.palette.text.secondary, flexShrink: 0, fontSize: "0.9rem" })}
      >
        {currency.code as string}
      </Typography>
    </Box>
  );
}
