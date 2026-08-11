"use client";

import type * as React from "react";
import {
  PaymentMethodAutocompleteShared,
  type PaymentMethodAutocompleteSlots,
} from "@/frontend/common/components/ui/input/paymentMethodSelect/PaymentMethodAutocompleteShared";
import { PaymentMethodOptionRow } from "@/frontend/common/components/ui/input/paymentMethodSelect/PaymentMethodOptionRow";
import type { PaymentMethodAutocompleteProps } from "@/frontend/common/components/ui/input/paymentMethodSelect/types";

export type { PaymentMethodAutocompleteProps } from "@/frontend/common/components/ui/input/paymentMethodSelect/types";
export type { PaymentMethodCatalogOption } from "@/frontend/common/lib/payment-method";

const commonSlots: PaymentMethodAutocompleteSlots = {
  OptionRow: PaymentMethodOptionRow,
};

export const PaymentMethodAutocomplete: React.FC<PaymentMethodAutocompleteProps> = (
  props: PaymentMethodAutocompleteProps
): React.ReactNode => <PaymentMethodAutocompleteShared {...props} slots={commonSlots} />;
