"use client";

import type * as React from "react";
import type { PaymentMethodCatalogOption } from "@/frontend/common/lib/payment-method";
import { PaymentMethodAutocompleteMobile } from "@/frontend/mobile/components/ui/input/paymentMethodSelect/paymentMethodAutocomplete.mobile";
import type {
  PaymentMethodAutocompleteProps,
  PaymentMethodSelectProps,
} from "@/frontend/mobile/components/ui/input/paymentMethodSelect/paymentMethodAutocomplete.types";

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

export type { PaymentMethodCatalogOption };
