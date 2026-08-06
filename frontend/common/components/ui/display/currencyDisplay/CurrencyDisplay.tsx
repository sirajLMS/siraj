"use client";

import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import {
  CURRENCY_DISPLAY_PART_ORDER,
  CurrencyDisplayPart,
  type CurrencyDisplayPartValue,
  resolveCurrencyDisplayParts,
} from "@/frontend/common/components/ui/display/currencyDisplay/constants";
import { LocaleEmoji } from "@/frontend/common/components/ui/display/localeEmoji/LocaleEmoji";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { getCurrencyDisplayName, getCurrencyFlag, getCurrencySymbol } from "@/frontend/common/lib/currency";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import type { UiTypographyVariant } from "@/frontend/common/types/shared.types";

export type CurrencyDisplayProps = {
  readonly code?: CurrencyCode | string | null;
  /**
   * Which currency ingredients to render. Order in the array is ignored;
   * parts always render as flag → label → symbol → code.
   *
   * When omitted or empty, defaults to flag + symbol.
   */
  readonly parts?: readonly CurrencyDisplayPartValue[];
  readonly fallback?: string;
  readonly typographyVariant?: UiTypographyVariant;
  readonly sx?: SxProps<Theme>;
};

export const CurrencyDisplay = ({
  code,
  parts,
  fallback,
  typographyVariant,
  sx,
}: CurrencyDisplayProps): React.JSX.Element | null => {
  const locale = useAppLocale();
  const visibleParts = resolveCurrencyDisplayParts(parts);
  const fallbackNode = fallback ? (
    <Typography variant={typographyVariant} sx={{ whiteSpace: "nowrap" }}>
      {fallback}
    </Typography>
  ) : null;

  if (!code) {
    return fallbackNode;
  }

  const flag = getCurrencyFlag(code);
  const longLabel = getCurrencyDisplayName(code, locale);
  const symbol = getCurrencySymbol(code);
  const shortCode = code;

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", ...sx }}>
      {CURRENCY_DISPLAY_PART_ORDER.map(part => {
        switch (part) {
          case CurrencyDisplayPart.Flag:
            return visibleParts.has(part) ? <LocaleEmoji key={part} emoji={flag} /> : null;
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
