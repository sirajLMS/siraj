"use client";

import type * as React from "react";
import type { CurrencyOption } from "@/frontend/common/lib/currency";
import { CurrencyAutocompleteMobile } from "@/frontend/mobile/components/ui/input/currencySelect/currencyAutocomplete.mobile";
import type { CurrencyAutocompleteProps } from "@/frontend/mobile/components/ui/input/currencySelect/currencyAutocomplete.types";

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
