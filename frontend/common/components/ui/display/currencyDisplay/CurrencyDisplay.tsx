"use client";

import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import type { TypographyProps } from "@mui/material/Typography";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import { LocaleEmoji } from "@/frontend/common/components/ui/display/localeEmoji/LocaleEmoji";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { getCurrencyDisplayName, getCurrencyFlag, getCurrencySymbol } from "@/frontend/common/lib/currency";
import { useAppLocale } from "@/frontend/common/providers/LocaleProvider";

export const CurrencyDisplayPart = {
  Flag: "flag",
  Label: "label",
  Symbol: "symbol",
  Code: "code",
} as const;

export type CurrencyDisplayPart = (typeof CurrencyDisplayPart)[keyof typeof CurrencyDisplayPart];

/** Fixed render order regardless of the order in `parts`. */
export const CURRENCY_DISPLAY_PART_ORDER: readonly CurrencyDisplayPart[] = [
  CurrencyDisplayPart.Flag,
  CurrencyDisplayPart.Label,
  CurrencyDisplayPart.Symbol,
  CurrencyDisplayPart.Code,
];

export const DEFAULT_CURRENCY_DISPLAY_PARTS: readonly CurrencyDisplayPart[] = [
  CurrencyDisplayPart.Flag,
  CurrencyDisplayPart.Symbol,
];

export type CurrencyDisplayProps = {
  readonly code?: CurrencyCode | string | null;
  /**
   * Which currency ingredients to render. Order in the array is ignored;
   * parts always render as flag → label → symbol → code.
   *
   * When omitted or empty, defaults to flag + symbol.
   */
  readonly parts?: readonly CurrencyDisplayPart[];
  readonly fallback?: string;
  readonly typographyVariant?: TypographyProps["variant"];
  readonly sx?: SxProps<Theme>;
};

function resolveCurrencyDisplayParts(parts?: readonly CurrencyDisplayPart[]): Set<CurrencyDisplayPart> {
  const resolved = parts && parts.length > 0 ? parts : DEFAULT_CURRENCY_DISPLAY_PARTS;
  return new Set(resolved);
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  code,
  parts,
  fallback,
  typographyVariant,
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
