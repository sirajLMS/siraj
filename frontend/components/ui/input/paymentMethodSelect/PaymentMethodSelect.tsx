"use client";

import type * as React from "react";
import {
  PaymentMethodAutocomplete,
  type PaymentMethodAutocompleteProps,
} from "@/frontend/components/ui/input/paymentMethodSelect/PaymentMethodAutocomplete";
import type { PaymentMethodCatalogOption } from "@/frontend/common/lib/payment-method";

export type PaymentMethodSelectProps = {
  readonly option?: PaymentMethodCatalogOption | null;
  readonly options: readonly PaymentMethodCatalogOption[];
  readonly setOptionAction: (option: PaymentMethodCatalogOption) => void;
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
  readonly allowedSlugs?: PaymentMethodAutocompleteProps["allowedSlugs"];
  readonly type?: PaymentMethodAutocompleteProps["type"];
  readonly showSlug?: boolean;
};

/**
 * PaymentMethodSelect allows the operator to pick a catalog-backed payment
 * method from a searchable Autocomplete. Mirrors `CurrencySelect` /
 * `CurrencyAutocomplete`.
 */
export const PaymentMethodSelect: React.FC<PaymentMethodSelectProps> = ({
  option,
  setOptionAction,
  options,
  ...props
}: PaymentMethodSelectProps): React.ReactNode => {
  const autocompleteProps: PaymentMethodAutocompleteProps = {
    option,
    options,
    onChangeAction: setOptionAction,
    matchAnchorWidth: true,
    showSlug: true,
    ...props,
  };

  return <PaymentMethodAutocomplete {...autocompleteProps} />;
};
