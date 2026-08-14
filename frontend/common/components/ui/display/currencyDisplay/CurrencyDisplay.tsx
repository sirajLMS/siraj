"use client";

import type * as React from "react";
import { CurrencyDisplayShared } from "@/frontend/common/components/ui/display/currencyDisplay/CurrencyDisplayShared";
import type { CurrencyDisplayProps } from "@/frontend/common/components/ui/display/currencyDisplay/types/currencyDisplay.types";
import { LocaleEmoji } from "@/frontend/common/components/ui/display/localeEmoji/LocaleEmoji";

/** Default typography variant for the viewport-agnostic common currency display. */
const DEFAULT_TYPOGRAPHY_VARIANT = "labelMd" as const;

/** Default spacing between currency parts for the common display. */
const DEFAULT_SPACING = 1;

export const CurrencyDisplay = ({
  code,
  parts,
  fallback,
  typographyVariant,
  sx,
}: Readonly<CurrencyDisplayProps>): React.JSX.Element | null => (
  <CurrencyDisplayShared
    code={code}
    parts={parts}
    fallback={fallback}
    typographyVariant={typographyVariant}
    sx={sx}
    defaultTypographyVariant={DEFAULT_TYPOGRAPHY_VARIANT}
    spacing={DEFAULT_SPACING}
    LocaleEmojiComponent={LocaleEmoji}
  />
);
