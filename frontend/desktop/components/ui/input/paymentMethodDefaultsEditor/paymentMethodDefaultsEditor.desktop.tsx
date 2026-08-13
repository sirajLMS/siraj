"use client";

import type * as React from "react";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import {
  PAYMENT_METHOD_DEFAULTS_EDITOR_DESKTOP_OPTIONS,
  PaymentMethodDefaultsEditorShared,
  type PaymentMethodDefaultsEditorSlots,
} from "@/frontend/common/components/ui/input/paymentMethodDefaultsEditor/PaymentMethodDefaultsEditorShared";
import type { PaymentMethodDefaultsEditorProps } from "@/frontend/common/components/ui/input/paymentMethodDefaultsEditor/types";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { CurrencySelectDesktop } from "@/frontend/desktop/components/ui/input/currencySelect";
import { LocalizedStringDrawerDesktop } from "@/frontend/desktop/components/ui/input/localizedString";

const desktopSlots: PaymentMethodDefaultsEditorSlots = {
  StatusBadge: DesktopStatusBadge,
  FormSuccessSnackbar: FormSuccessSnackbar,
  CurrencySelect: CurrencySelectDesktop,
  LocalizedStringDrawer: LocalizedStringDrawerDesktop,
};

export const PaymentMethodDefaultsEditorDesktop: React.FC<PaymentMethodDefaultsEditorProps> = (
  props: Readonly<PaymentMethodDefaultsEditorProps>
): React.ReactNode => (
  <PaymentMethodDefaultsEditorShared
    {...props}
    slots={desktopSlots}
    options={PAYMENT_METHOD_DEFAULTS_EDITOR_DESKTOP_OPTIONS}
  />
);
