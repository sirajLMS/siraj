"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import type { LocaleEmojiProps } from "@/frontend/common/components/ui/display/localeEmoji/types/localeEmoji.types";
import type { CurrencyOptionRowProps } from "@/frontend/common/components/ui/input/currencySelect/currencyOptionRow.types";
import { getCurrencyDisplayName } from "@/frontend/common/lib/currency";

export type CurrencyOptionRowSlotProps = {
  readonly LocaleEmoji: React.ComponentType<LocaleEmojiProps>;
  readonly gap?: number;
  readonly minHeight?: number;
  readonly labelFontSize?: string;
  readonly secondaryFontSize?: string;
};

export function CurrencyOptionRowShared({
  currency,
  locale,
  showSymbol = true,
  LocaleEmoji,
  gap = 1,
  minHeight,
  labelFontSize,
  secondaryFontSize,
}: CurrencyOptionRowProps & CurrencyOptionRowSlotProps): React.ReactNode {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap, width: "100%", minHeight }}>
      <LocaleEmoji emoji={currency.flagEmoji} />
      <Typography component="span" sx={{ flex: 1, fontSize: labelFontSize }}>
        {getCurrencyDisplayName(currency.code, locale)}
      </Typography>
      {showSymbol ? (
        <Typography
          component="span"
          dir="ltr"
          sx={theme => ({ color: theme.palette.text.secondary, flexShrink: 0, fontSize: secondaryFontSize })}
        >
          {currency.symbol}
        </Typography>
      ) : null}
      <Typography
        component="span"
        dir="ltr"
        sx={theme => ({ color: theme.palette.text.secondary, flexShrink: 0, fontSize: secondaryFontSize })}
      >
        {currency.code as string}
      </Typography>
    </Box>
  );
}
