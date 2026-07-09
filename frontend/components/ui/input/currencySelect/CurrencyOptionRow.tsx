"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import { LocaleEmoji } from "@/frontend/components/ui/display";
import type { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { type CurrencyOption, getCurrencyDisplayName } from "@/frontend/lib/currency";

export type CurrencyOptionRowProps = {
  readonly currency: CurrencyOption;
  readonly locale: string;
  readonly showSymbol?: boolean;
};

export function CurrencyOptionRow({
  currency,
  locale,
  showSymbol = true,
}: CurrencyOptionRowProps): React.ReactNode {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
      <LocaleEmoji emoji={currency.flagEmoji} />
      <Typography component="span" sx={{ flex: 1 }}>
        {getCurrencyDisplayName(currency.code, locale)}
      </Typography>
      {showSymbol ? (
        <Typography
          component="span"
          dir="ltr"
          sx={theme => ({ color: theme.palette.text.secondary, flexShrink: 0 })}
        >
          {currency.symbol}
        </Typography>
      ) : null}
      <Typography
        component="span"
        dir="ltr"
        sx={theme => ({ color: theme.palette.text.secondary, flexShrink: 0 })}
      >
        {currency.code as string}
      </Typography>
    </Box>
  );
}

export function getCurrencyOptionRowLabel(currency: CurrencyOption, locale: string): string {
  const name = getCurrencyDisplayName(currency.code, locale);
  return `${name} (${currency.code as string})`;
}
