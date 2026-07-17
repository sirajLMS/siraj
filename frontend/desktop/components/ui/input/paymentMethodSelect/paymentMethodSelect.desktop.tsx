"use client";

import type * as React from "react";
import type { PaymentMethodAutocompleteProps } from "@/frontend/common/components/ui/input/paymentMethodSelect/PaymentMethodAutocomplete";
import type { PaymentMethodSelectProps } from "@/frontend/common/components/ui/input/paymentMethodSelect/PaymentMethodSelect";
import type { PaymentMethodCatalogOption } from "@/frontend/common/lib/payment-method";
import { PaymentMethodAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/paymentMethodSelect/paymentMethodAutocomplete.desktop";

export type PaymentMethodSelectDesktopProps = PaymentMethodSelectProps;

export const PaymentMethodSelectDesktop: React.FC<PaymentMethodSelectDesktopProps> = ({
  option,
  setOptionAction,
  options,
  ...props
}: PaymentMethodSelectDesktopProps): React.ReactNode => {
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

export type { PaymentMethodCatalogOption };
