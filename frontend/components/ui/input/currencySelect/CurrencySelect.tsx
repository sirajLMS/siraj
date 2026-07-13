"use client";

import type * as React from "react";
import {
  CurrencyAutocomplete,
  type CurrencyAutocompleteProps,
} from "@/frontend/components/ui/input/currencySelect/CurrencyAutocomplete";
import type { CurrencyOption } from "@/frontend/common/lib/currency";

export type CurrencySelectProps = {
  readonly currency?: CurrencyOption | null;
  readonly setCurrencyAction: (currency: CurrencyOption) => void;
  readonly onClearAction?: () => void;
  readonly autoComplete?: string;
  readonly fullWidth?: boolean;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly placeholder?: string;
  readonly error?: boolean;
  readonly helperText?: string;
  readonly onBlurAction?: () => void;
  readonly style?: React.CSSProperties;
  readonly open?: boolean;
  readonly onOpenAction?: () => void;
  readonly onCloseAction?: () => void;
  readonly autoFocus?: boolean;
  readonly allowedCodes?: CurrencyAutocompleteProps["allowedCodes"];
  readonly showSymbol?: boolean;
};

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
