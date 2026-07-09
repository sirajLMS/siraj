"use client";

import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import type { TypographyProps } from "@mui/material/Typography";
import Typography from "@mui/material/Typography";
import { useLocale } from "next-intl";
import type * as React from "react";
import { LocaleEmoji } from "@/frontend/components/ui/display/LocaleEmoji";
import type { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { getCurrencyDisplayName, getCurrencyFlag, getCurrencySymbol } from "@/frontend/lib/currency";

export type CurrencyDisplayProps = {
  readonly code?: CurrencyCode | string | null;
  /**
   * Render the flag emoji of a representative country for the currency.
   */
  readonly showFlag?: boolean;
  /**
   * Render the long localized currency name (e.g. "Saudi Riyal").
   */
  readonly showLabel?: boolean;
  /**
   * Render the short ISO 4217 code (e.g. "SAR").
   */
  readonly showCode?: boolean;
  /**
   * Render the currency symbol glyph (e.g. "ر.س").
   */
  readonly showSymbol?: boolean;
  readonly fallback?: string;
  readonly typographyVariant?: TypographyProps["variant"];
  readonly sx?: SxProps<Theme>;
};

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  code,
  showFlag = true,
  showLabel = true,
  showCode = false,
  showSymbol = false,
  fallback,
  typographyVariant,
  sx,
}): React.ReactNode => {
  const locale = useLocale();

  if (!code) {
    return (fallback ?? null) as React.ReactNode;
  }

  const flag = getCurrencyFlag(code);
  const longLabel = getCurrencyDisplayName(code, locale);
  const symbol = getCurrencySymbol(code);
  const shortCode = code as string;

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", ...sx }}>
      {showFlag ? <LocaleEmoji emoji={flag} /> : null}
      {showLabel ? (
        <Typography variant={typographyVariant} sx={{ whiteSpace: "nowrap" }}>
          {longLabel}
        </Typography>
      ) : null}
      {showSymbol ? (
        <Typography component="span" sx={theme => ({ color: theme.palette.text.secondary, whiteSpace: "nowrap" })}>
          {symbol}
        </Typography>
      ) : null}
      {showCode ? (
        <Typography component="span" dir="ltr" sx={theme => ({ color: theme.palette.text.secondary, flexShrink: 0 })}>
          {shortCode}
        </Typography>
      ) : null}
    </Stack>
  );
};
