"use client";

import Box from "@mui/material/Box";
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
import type { CurrencyDisplayProps } from "@/frontend/common/components/ui/display/currencyDisplay/types/currencyDisplay.types";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { getCurrencyDisplayName, getCurrencyFlag, getCurrencySymbol } from "@/frontend/common/lib/currency";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import type { UiTypographyVariantLoose } from "@/frontend/common/types/shared.types";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";

type LocaleEmojiComponentType = React.FC<{ readonly emoji: string }>;

export interface CurrencyDisplaySharedProps extends Omit<CurrencyDisplayProps, "typographyVariant"> {
  /** Default typography variant when none is supplied. */
  readonly defaultTypographyVariant: UiTypographyVariantLoose;
  /** Stack spacing between parts. */
  readonly spacing: number;
  /** Tier-specific LocaleEmoji slot. */
  readonly LocaleEmojiComponent: LocaleEmojiComponentType;
  /** Optional caller-supplied typography variant (falls back to `defaultTypographyVariant`). */
  readonly typographyVariant?: UiTypographyVariantLoose;
  readonly sx?: SxProps<Theme>;
}

interface CurrencyPartValues {
  readonly flag: string;
  readonly longLabel: string;
  readonly symbol: string;
  readonly shortCode: string;
  readonly typographyVariant: UiTypographyVariantLoose;
}

function renderCurrencyPart(
  part: CurrencyDisplayPartValue,
  visibleParts: ReadonlySet<CurrencyDisplayPartValue>,
  values: CurrencyPartValues,
  LocaleEmojiComponent: LocaleEmojiComponentType
): React.ReactNode {
  if (!visibleParts.has(part)) return null;
  const { flag, longLabel, symbol, shortCode, typographyVariant } = values;
  switch (part) {
    case CurrencyDisplayPart.Flag:
      return <LocaleEmojiComponent key={part} emoji={flag} />;
    case CurrencyDisplayPart.Label:
      return (
        <Typography key={part} sx={{ typography: typographyVariant, whiteSpace: "nowrap" }}>
          {longLabel}
        </Typography>
      );
    case CurrencyDisplayPart.Symbol:
      return (
        <Box key={part} component="span" sx={theme => ({ color: theme.palette.text.secondary, whiteSpace: "nowrap" })}>
          {symbol}
        </Box>
      );
    case CurrencyDisplayPart.Code:
      return (
        <Box
          key={part}
          component="span"
          sx={theme => ({ color: theme.palette.text.secondary, flexShrink: 0, direction: "ltr" })}
        >
          {shortCode}
        </Box>
      );
    default:
      return null;
  }
}

export function CurrencyDisplayShared({
  code,
  parts,
  fallback,
  defaultTypographyVariant,
  spacing,
  LocaleEmojiComponent,
  typographyVariant,
  sx,
}: Readonly<CurrencyDisplaySharedProps>): React.JSX.Element | null {
  const locale = useAppLocale();
  const visibleParts = resolveCurrencyDisplayParts(parts);
  const resolvedVariant = typographyVariant ?? defaultTypographyVariant;
  const fallbackNode = fallback ? (
    <Typography sx={{ typography: resolvedVariant, whiteSpace: "nowrap" }}>{fallback}</Typography>
  ) : null;

  if (!code) {
    return fallbackNode;
  }

  const flag = getCurrencyFlag(code);
  const longLabel = getCurrencyDisplayName(code, locale);
  const symbol = getCurrencySymbol(code);
  const shortCode: CurrencyCode = code;
  const values: CurrencyPartValues = { flag, longLabel, symbol, shortCode, typographyVariant: resolvedVariant };

  return (
    <Stack direction="row" spacing={spacing} sx={mergeSx({ alignItems: "center" }, sx)}>
      {CURRENCY_DISPLAY_PART_ORDER.map(part => renderCurrencyPart(part, visibleParts, values, LocaleEmojiComponent))}
    </Stack>
  );
}
