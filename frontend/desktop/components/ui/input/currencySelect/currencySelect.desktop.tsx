"use client";

import type * as React from "react";
import type { CurrencyOption } from "@/frontend/common/lib/currency";
import type { CurrencyAutocompleteProps } from "@/frontend/desktop/components/ui/input/currencySelect/currencyAutocomplete.desktop";
import { CurrencyAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/currencySelect/currencyAutocomplete.desktop";

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
