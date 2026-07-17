"use client";

import type * as React from "react";
import type { PaymentMethodAutocompleteProps } from "@/frontend/common/components/ui/input/paymentMethodSelect/PaymentMethodAutocomplete";
import type { PaymentMethodSelectProps } from "@/frontend/common/components/ui/input/paymentMethodSelect/PaymentMethodSelect";
import type { PaymentMethodCatalogOption } from "@/frontend/common/lib/payment-method";
import { PaymentMethodAutocompleteMobile } from "@/frontend/mobile/components/ui/input/paymentMethodSelect/paymentMethodAutocomplete.mobile";

export type PaymentMethodSelectMobileProps = PaymentMethodSelectProps;

export const PaymentMethodSelectMobile: React.FC<PaymentMethodSelectMobileProps> = ({
  option,
  setOptionAction,
  options,
  ...props
}: PaymentMethodSelectMobileProps): React.ReactNode => {
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
