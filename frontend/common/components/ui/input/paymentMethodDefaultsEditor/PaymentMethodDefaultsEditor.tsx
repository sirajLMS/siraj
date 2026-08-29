"use client";

import type * as React from "react";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect/CurrencySelect";
import { LocalizedStringDrawer } from "@/frontend/common/components/ui/input/localizedString/LocalizedStringDrawer";
import {
  PAYMENT_METHOD_DEFAULTS_EDITOR_DESKTOP_OPTIONS,
  PaymentMethodDefaultsEditorShared,
  type PaymentMethodDefaultsEditorSlots,
} from "@/frontend/common/components/ui/input/paymentMethodDefaultsEditor/PaymentMethodDefaultsEditorShared";
import type { PaymentMethodDefaultsEditorProps } from "@/frontend/common/components/ui/input/paymentMethodDefaultsEditor/types";

export type { PaymentMethodDefaultsEditorProps } from "@/frontend/common/components/ui/input/paymentMethodDefaultsEditor/types";

const commonSlots: PaymentMethodDefaultsEditorSlots = {
  StatusBadge,
  FormSuccessSnackbar,
  CurrencySelect,
  LocalizedStringDrawer,
};

export const PaymentMethodDefaultsEditor: React.FC<PaymentMethodDefaultsEditorProps> = (
  props: Readonly<PaymentMethodDefaultsEditorProps>
): React.ReactNode => (
  <PaymentMethodDefaultsEditorShared
    {...props}
    slots={commonSlots}
    options={PAYMENT_METHOD_DEFAULTS_EDITOR_DESKTOP_OPTIONS}
  />
);
