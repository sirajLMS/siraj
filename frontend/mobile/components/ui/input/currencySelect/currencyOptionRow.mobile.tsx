"use client";

import type * as React from "react";
import type { CurrencyOptionRowProps } from "@/frontend/common/components/ui/input/currencySelect/currencyOptionRow.types";
import { CurrencyOptionRowShared } from "@/frontend/common/components/ui/input/currencySelect/currencyOptionRowShared";
import { MobileLocaleEmoji } from "@/frontend/mobile/components/ui/display/localeEmoji";

export function CurrencyOptionRowMobile({
  currency,
  locale,
  showSymbol = true,
}: CurrencyOptionRowProps): React.ReactNode {
  return (
    <CurrencyOptionRowShared
      currency={currency}
      locale={locale}
      showSymbol={showSymbol}
      LocaleEmoji={MobileLocaleEmoji}
      gap={1.5}
      minHeight={44}
      labelFontSize="1rem"
      secondaryFontSize="0.9rem"
    />
  );
}
