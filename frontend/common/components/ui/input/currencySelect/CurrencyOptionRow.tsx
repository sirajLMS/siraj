"use client";

import type * as React from "react";
import { LocaleEmoji } from "@/frontend/common/components/ui/display/localeEmoji/LocaleEmoji";
import type { CurrencyOptionRowProps } from "@/frontend/common/components/ui/input/currencySelect/currencyOptionRow.types";
import { CurrencyOptionRowShared } from "@/frontend/common/components/ui/input/currencySelect/currencyOptionRowShared";

export function CurrencyOptionRow({ currency, locale, showSymbol = true }: CurrencyOptionRowProps): React.ReactNode {
  return (
    <CurrencyOptionRowShared currency={currency} locale={locale} showSymbol={showSymbol} LocaleEmoji={LocaleEmoji} />
  );
}
