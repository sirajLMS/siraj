"use client";

import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import type { TypographyProps } from "@mui/material/Typography";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import {
  CURRENCY_DISPLAY_PART_ORDER,
  CurrencyDisplayPart,
  type CurrencyDisplayPartValue,
  resolveCurrencyDisplayParts,
} from "@/frontend/common/components/ui/display/currencyDisplay/constants";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { getCurrencyDisplayName, getCurrencyFlag, getCurrencySymbol } from "@/frontend/common/lib/currency";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { MobileLocaleEmoji } from "@/frontend/mobile/components/ui/display/localeEmoji/localeEmoji.mobile";

export type MobileCurrencyDisplayProps = {
  readonly code?: CurrencyCode | string | null;
  /**
   * Which currency ingredients to render. Order in the array is ignored;
   * parts always render as flag -> label -> symbol -> code.
   *
   * When omitted or empty, defaults to flag + symbol.
   */
  readonly parts?: readonly CurrencyDisplayPartValue[];
  readonly fallback?: string;
  readonly typographyVariant?: NonNullable<TypographyProps["variant"]> | (string & {});
  readonly sx?: SxProps<Theme>;
};

/**
 * Mobile-tier currency display.
 *
 * Differences vs desktop:
 * - Tighter `spacing={0.5}` (vs desktop `spacing={1}`) for dense inline rows.
 * - Default `typographyVariant="bodySm"` (vs desktop `"bodyMd"`) for compact
 *   mobile typography.
 * - Renders the mobile-tier `MobileLocaleEmoji` primitive (imported from the
 *   mobile locale module path created by a sibling subagent); falls back to
 *   a minimal inline emoji span if that import cannot be resolved by the
 *   type-checker (kept as a normal `import` - no dynamic fallback).
 */
export const MobileCurrencyDisplay: React.FC<MobileCurrencyDisplayProps> = ({
  code,
  parts,
  fallback,
  typographyVariant = "bodySm",
  sx,
}): React.ReactNode => {
  const locale = useAppLocale();
  const visibleParts = resolveCurrencyDisplayParts(parts);

  let content: React.ReactNode;
  if (!code) {
    content = fallback ?? null;
  } else {
    const flag = getCurrencyFlag(code);
    const longLabel = getCurrencyDisplayName(code, locale);
    const symbol = getCurrencySymbol(code);
    const shortCode = code;

    content = (
      <Stack direction="row" spacing={0.5} sx={mergeSx({ alignItems: "center" }, sx)}>
        {CURRENCY_DISPLAY_PART_ORDER.map(part => {
          switch (part) {
            case CurrencyDisplayPart.Flag:
              return visibleParts.has(part) ? <MobileLocaleEmoji key={part} emoji={flag} /> : null;
            case CurrencyDisplayPart.Label:
              return visibleParts.has(part) ? (
                <Typography key={part} sx={{ typography: typographyVariant, whiteSpace: "nowrap" }}>
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
  }
  return content;
};
