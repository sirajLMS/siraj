"use client";

import type * as React from "react";
import type {
  CurrencyAutocompleteProps,
  CurrencySelectProps,
} from "@/frontend/common/components/ui/input/currencySelect/types";
import { CurrencyAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/currencySelect/currencyAutocomplete.desktop";

export const CurrencySelectDesktop: React.FC<CurrencySelectProps> = ({
  currency,
  setCurrencyAction: onChangeAction,
  onClearAction,
  ...props
}: CurrencySelectProps): React.ReactNode => {
  const autocompleteProps: CurrencyAutocompleteProps = {
    currency,
    onChangeAction,
    onClearAction,
    matchAnchorWidth: true,
    showSymbol: true,
    ...props,
  };

  return <CurrencyAutocompleteDesktop {...autocompleteProps} />;
};
