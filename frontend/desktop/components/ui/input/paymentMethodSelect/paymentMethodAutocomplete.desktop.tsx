"use client";

import type * as React from "react";
import {
  PaymentMethodAutocompleteShared,
  type PaymentMethodAutocompleteSlots,
} from "@/frontend/common/components/ui/input/paymentMethodSelect/PaymentMethodAutocompleteShared";
import type { PaymentMethodAutocompleteProps } from "@/frontend/common/components/ui/input/paymentMethodSelect/types";
import { PaymentMethodOptionRowDesktop } from "@/frontend/desktop/components/ui/input/paymentMethodSelect/paymentMethodOptionRow.desktop";

export type { PaymentMethodCatalogOption } from "@/frontend/common/lib/payment-method";

const desktopSlots: PaymentMethodAutocompleteSlots = {
  OptionRow: PaymentMethodOptionRowDesktop,
};

export const PaymentMethodAutocompleteDesktop: React.FC<PaymentMethodAutocompleteProps> = (
  props: PaymentMethodAutocompleteProps
): React.ReactNode => <PaymentMethodAutocompleteShared {...props} slots={desktopSlots} />;
