"use client";

import type * as React from "react";
import type { CurrencyOptionRowProps } from "@/frontend/common/components/ui/input/currencySelect/currencyOptionRow.types";
import { CurrencyOptionRowShared } from "@/frontend/common/components/ui/input/currencySelect/currencyOptionRowShared";
import { DesktopLocaleEmoji } from "@/frontend/desktop/components/ui/display/localeEmoji";

export function CurrencyOptionRowDesktop({
  currency,
  locale,
  showSymbol = true,
}: CurrencyOptionRowProps): React.ReactNode {
  return (
    <CurrencyOptionRowShared
      currency={currency}
      locale={locale}
      showSymbol={showSymbol}
      LocaleEmoji={DesktopLocaleEmoji}
    />
  );
}
