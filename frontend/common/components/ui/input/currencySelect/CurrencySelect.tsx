"use client";

import type * as React from "react";
import { CurrencyAutocomplete } from "@/frontend/common/components/ui/input/currencySelect/CurrencyAutocomplete";
import type {
  CurrencyAutocompleteProps,
  CurrencySelectProps,
} from "@/frontend/common/components/ui/input/currencySelect/types";

/**
 * CurrencySelect allows the operator to pick an ISO 4217 currency from a
 * searchable Autocomplete. The selected value is a `CurrencyOption` whose
 * `code` is the codegen `CurrencyCode` enum value (the GraphQL wire
 * format). Mirrors `CountrySelect` / `CountryAutocomplete`.
 */
export const CurrencySelect: React.FC<CurrencySelectProps> = ({
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

  return <CurrencyAutocomplete {...autocompleteProps} />;
};
