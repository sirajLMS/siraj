"use client";

import Box from "@mui/material/Box";
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
      <Box component="span" sx={{ flex: 1, fontSize: labelFontSize }}>
        {getCurrencyDisplayName(currency.code, locale)}
      </Box>
      {showSymbol ? (
        <Box
          component="span"
          sx={theme => ({
            color: theme.palette.text.secondary,
            flexShrink: 0,
            fontSize: secondaryFontSize,
            direction: "ltr",
          })}
        >
          {currency.symbol}
        </Box>
      ) : null}
      <Box
        component="span"
        sx={theme => ({
          color: theme.palette.text.secondary,
          flexShrink: 0,
          fontSize: secondaryFontSize,
          direction: "ltr",
        })}
      >
        {currency.code as string}
      </Box>
    </Box>
  );
}
