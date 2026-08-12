"use client";

import type * as React from "react";
import {
  PaymentMethodAutocompleteShared,
  type PaymentMethodAutocompleteSlots,
} from "@/frontend/common/components/ui/input/paymentMethodSelect/PaymentMethodAutocompleteShared";
import type { PaymentMethodAutocompleteProps } from "@/frontend/common/components/ui/input/paymentMethodSelect/types";
import { PaymentMethodOptionRowMobile } from "@/frontend/mobile/components/ui/input/paymentMethodSelect/paymentMethodOptionRow.mobile";

const MOBILE_OPTION_SX: PaymentMethodAutocompleteSlots["optionRowSx"] = { px: 1.5, py: 1.25, minHeight: 48 };

const mobileSlots: PaymentMethodAutocompleteSlots = {
  OptionRow: PaymentMethodOptionRowMobile,
  optionRowSx: MOBILE_OPTION_SX,
  textFieldSize: "small",
  fullWidthDefault: true,
};

export const PaymentMethodAutocompleteMobile: React.FC<PaymentMethodAutocompleteProps> = (
  props: PaymentMethodAutocompleteProps
): React.ReactNode => <PaymentMethodAutocompleteShared {...props} slots={mobileSlots} />;
