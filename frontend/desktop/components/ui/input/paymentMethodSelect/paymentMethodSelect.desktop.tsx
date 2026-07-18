"use client";

import type * as React from "react";
import type {
  PaymentMethodAutocompleteProps,
  PaymentMethodSelectProps,
} from "@/frontend/common/components/ui/input/paymentMethodSelect/types";
import { PaymentMethodAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/paymentMethodSelect/paymentMethodAutocomplete.desktop";

export const PaymentMethodSelectDesktop: React.FC<PaymentMethodSelectProps> = ({
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

  return <PaymentMethodAutocompleteDesktop {...autocompleteProps} />;
};
