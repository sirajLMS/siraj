"use client";

import type * as React from "react";
import type {
  CurrencyAutocompleteProps,
  CurrencySelectProps,
} from "@/frontend/common/components/ui/input/currencySelect/types";
import { CurrencyAutocompleteMobile } from "@/frontend/mobile/components/ui/input/currencySelect/currencyAutocomplete.mobile";

export const CurrencySelectMobile: React.FC<CurrencySelectProps> = ({
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

  return <CurrencyAutocompleteMobile {...autocompleteProps} />;
};
