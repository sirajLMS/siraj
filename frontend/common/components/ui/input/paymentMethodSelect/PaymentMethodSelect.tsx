"use client";

import type * as React from "react";
import { PaymentMethodAutocomplete } from "@/frontend/common/components/ui/input/paymentMethodSelect/PaymentMethodAutocomplete";
import type {
  PaymentMethodAutocompleteProps,
  PaymentMethodSelectProps,
} from "@/frontend/common/components/ui/input/paymentMethodSelect/types";

export type { PaymentMethodSelectProps } from "@/frontend/common/components/ui/input/paymentMethodSelect/types";

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
