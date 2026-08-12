"use client";

import type * as React from "react";
import { CurrencyDisplayShared } from "@/frontend/common/components/ui/display/currencyDisplay/CurrencyDisplayShared";
import type { CurrencyDisplayProps } from "@/frontend/common/components/ui/display/currencyDisplay/types/currencyDisplay.types";
import { DesktopLocaleEmoji } from "@/frontend/desktop/components/ui/display/localeEmoji/localeEmoji.desktop";

export type DesktopCurrencyDisplayProps = CurrencyDisplayProps;

/** Default typography variant for the desktop currency display. */
const DEFAULT_TYPOGRAPHY_VARIANT = "bodyMd" as const;

/** Default spacing between currency parts for the desktop display. */
const DEFAULT_SPACING = 1;

export const DesktopCurrencyDisplay = ({
  code,
  parts,
  fallback,
  typographyVariant,
  sx,
}: Readonly<DesktopCurrencyDisplayProps>): React.JSX.Element | null => (
  <CurrencyDisplayShared
    code={code}
    parts={parts}
    fallback={fallback}
    typographyVariant={typographyVariant}
    sx={sx}
    defaultTypographyVariant={DEFAULT_TYPOGRAPHY_VARIANT}
    spacing={DEFAULT_SPACING}
    LocaleEmojiComponent={DesktopLocaleEmoji}
  />
);
