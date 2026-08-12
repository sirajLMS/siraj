"use client";

import type * as React from "react";
import {
  PAYMENT_METHOD_DEFAULTS_EDITOR_MOBILE_OPTIONS,
  PaymentMethodDefaultsEditorShared,
  type PaymentMethodDefaultsEditorSlots,
} from "@/frontend/common/components/ui/input/paymentMethodDefaultsEditor/PaymentMethodDefaultsEditorShared";
import type { PaymentMethodDefaultsEditorProps } from "@/frontend/common/components/ui/input/paymentMethodDefaultsEditor/types";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge/MobileStatusBadge";
import { MobileFormSuccessSnackbar } from "@/frontend/mobile/components/ui/form/snackbar/MobileFormSuccessSnackbar";
import { CurrencySelectMobile } from "@/frontend/mobile/components/ui/input/currencySelect";
import { LocalizedStringDrawerMobile } from "@/frontend/mobile/components/ui/input/localizedString";

const mobileSlots: PaymentMethodDefaultsEditorSlots = {
  StatusBadge: MobileStatusBadge,
  FormSuccessSnackbar: MobileFormSuccessSnackbar,
  CurrencySelect: CurrencySelectMobile,
  LocalizedStringDrawer: LocalizedStringDrawerMobile,
};

export const PaymentMethodDefaultsEditorMobile: React.FC<PaymentMethodDefaultsEditorProps> = (
  props: Readonly<PaymentMethodDefaultsEditorProps>
): React.ReactNode => (
  <PaymentMethodDefaultsEditorShared
    {...props}
    slots={mobileSlots}
    options={PAYMENT_METHOD_DEFAULTS_EDITOR_MOBILE_OPTIONS}
  />
);
