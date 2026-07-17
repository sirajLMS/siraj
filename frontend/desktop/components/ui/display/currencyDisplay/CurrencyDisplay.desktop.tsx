"use client";

import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import type { TypographyProps } from "@mui/material/Typography";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { getCurrencyDisplayName, getCurrencyFlag, getCurrencySymbol } from "@/frontend/common/lib/currency";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import {
  CURRENCY_DISPLAY_PART_ORDER,
  CurrencyDisplayPart,
  type CurrencyDisplayPartValue,
  resolveCurrencyDisplayParts,
} from "@/frontend/desktop/components/ui/display/currencyDisplay/currencyDisplay.constants";
import { DesktopLocaleEmoji } from "@/frontend/desktop/components/ui/display/localeEmoji/localeEmoji.desktop";

export type DesktopCurrencyDisplayProps = {
  readonly code?: CurrencyCode | string | null;
  /**
   * Which currency ingredients to render. Order in the array is ignored;
   * parts always render as flag -> label -> symbol -> code.
   *
   * When omitted or empty, defaults to flag + symbol.
   */
  readonly parts?: readonly CurrencyDisplayPartValue[];
  readonly fallback?: string;
  readonly typographyVariant?: TypographyProps["variant"];
  readonly sx?: SxProps<Theme>;
};

export const DesktopCurrencyDisplay: React.FC<DesktopCurrencyDisplayProps> = ({
  code,
  parts,
  fallback,
  typographyVariant = "bodyMd",
  sx,
}): React.ReactNode => {
  const locale = useAppLocale();
  const visibleParts = resolveCurrencyDisplayParts(parts);

  if (!code) {
    return (fallback ?? null) as React.ReactNode;
  }

  const flag = getCurrencyFlag(code);
  const longLabel = getCurrencyDisplayName(code, locale);
  const symbol = getCurrencySymbol(code);
  const shortCode = code as string;

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", ...sx }}>
      {CURRENCY_DISPLAY_PART_ORDER.map(part => {
        switch (part) {
          case CurrencyDisplayPart.Flag:
            return visibleParts.has(part) ? <DesktopLocaleEmoji key={part} emoji={flag} /> : null;
          case CurrencyDisplayPart.Label:
            return visibleParts.has(part) ? (
              <Typography key={part} variant={typographyVariant} sx={{ whiteSpace: "nowrap" }}>
                {longLabel}
              </Typography>
            ) : null;
          case CurrencyDisplayPart.Symbol:
            return visibleParts.has(part) ? (
              <Typography
                key={part}
                component="span"
                sx={theme => ({ color: theme.palette.text.secondary, whiteSpace: "nowrap" })}
              >
                {symbol}
              </Typography>
            ) : null;
          case CurrencyDisplayPart.Code:
            return visibleParts.has(part) ? (
              <Typography
                key={part}
                component="span"
                dir="ltr"
                sx={theme => ({ color: theme.palette.text.secondary, flexShrink: 0 })}
              >
                {shortCode}
              </Typography>
            ) : null;
          default:
            return null;
        }
      })}
    </Stack>
  );
};
