"use client";

import type * as React from "react";
import type {
  PaymentMethodAutocompleteProps,
  PaymentMethodSelectProps,
} from "@/frontend/common/components/ui/input/paymentMethodSelect/types";
import { PaymentMethodAutocompleteMobile } from "@/frontend/mobile/components/ui/input/paymentMethodSelect/paymentMethodAutocomplete.mobile";

export const PaymentMethodSelectMobile: React.FC<PaymentMethodSelectProps> = ({
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

  return <PaymentMethodAutocompleteMobile {...autocompleteProps} />;
};
