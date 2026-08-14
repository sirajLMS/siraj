"use client";

import type * as React from "react";
import {
  PaymentMethodAutocompleteShared,
  type PaymentMethodAutocompleteSlots,
} from "@/frontend/common/components/ui/input/paymentMethodSelect/PaymentMethodAutocompleteShared";
import { PaymentMethodOptionRow as PaymentMethodOptionRowDesktop } from "@/frontend/common/components/ui/input/paymentMethodSelect/PaymentMethodOptionRow";
import type { PaymentMethodAutocompleteProps } from "@/frontend/common/components/ui/input/paymentMethodSelect/types";

const desktopSlots: PaymentMethodAutocompleteSlots = {
  OptionRow: PaymentMethodOptionRowDesktop,
};

export const PaymentMethodAutocompleteDesktop: React.FC<PaymentMethodAutocompleteProps> = (
  props: PaymentMethodAutocompleteProps
): React.ReactNode => <PaymentMethodAutocompleteShared {...props} slots={desktopSlots} />;
