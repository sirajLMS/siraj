"use client";

import type * as React from "react";
import { CurrencyDisplayShared } from "@/frontend/common/components/ui/display/currencyDisplay/CurrencyDisplayShared";
import type { CurrencyDisplayProps } from "@/frontend/common/components/ui/display/currencyDisplay/types/currencyDisplay.types";
import { MobileLocaleEmoji } from "@/frontend/mobile/components/ui/display/localeEmoji/localeEmoji.mobile";

export type MobileCurrencyDisplayProps = CurrencyDisplayProps;

/** Default typography variant for the mobile currency display (compact). */
const DEFAULT_TYPOGRAPHY_VARIANT = "bodySm" as const;

/** Tighter spacing for dense inline mobile rows. */
const DEFAULT_SPACING = 0.5;

export const MobileCurrencyDisplay: React.FC<MobileCurrencyDisplayProps> = ({
  code,
  parts,
  fallback,
  typographyVariant,
  sx,
}): React.JSX.Element | null => (
  <CurrencyDisplayShared
    code={code}
    parts={parts}
    fallback={fallback}
    typographyVariant={typographyVariant}
    sx={sx}
    defaultTypographyVariant={DEFAULT_TYPOGRAPHY_VARIANT}
    spacing={DEFAULT_SPACING}
    LocaleEmojiComponent={MobileLocaleEmoji}
  />
);
