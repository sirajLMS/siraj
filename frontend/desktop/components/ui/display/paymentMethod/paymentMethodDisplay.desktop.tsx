"use client";

import type * as React from "react";
import {
  PaymentMethodDisplayShared,
  type PaymentMethodDisplaySlots,
} from "@/frontend/common/components/ui/display/paymentMethod/PaymentMethodDisplayShared";
import type { PaymentMethodDisplayProps } from "@/frontend/common/components/ui/display/paymentMethod/types";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { DesktopCountryDisplay } from "@/frontend/desktop/components/ui/display/countryDisplay/countryDisplay.desktop";
import { DesktopCurrencyDisplay } from "@/frontend/desktop/components/ui/display/currencyDisplay/CurrencyDisplay.desktop";
import { DesktopLocalizedStringDisplay } from "@/frontend/desktop/components/ui/display/localizedStringDisplay";
import { DesktopPhoneDisplay } from "@/frontend/desktop/components/ui/display/phoneDisplay/phoneDisplay.desktop";
import { Translation, useAppTranslation } from "@/shared/locale";

function isKeyOf<T extends object>(value: string | number | symbol, obj: T): value is keyof T {
  return value in obj;
}

function getLabel(labels: object, key: string): string {
  return isKeyOf(key, labels) ? labels[key] : "";
}

const DESKTOP_SLOTS: PaymentMethodDisplaySlots = {
  StatusBadge: DesktopStatusBadge,
  CountryDisplay: DesktopCountryDisplay,
  CurrencyDisplay: DesktopCurrencyDisplay,
  LocalizedStringDisplay: DesktopLocalizedStringDisplay,
  PhoneDisplay: DesktopPhoneDisplay,
};

export function DesktopPaymentMethodDisplay({ ...props }: Readonly<PaymentMethodDisplayProps>): React.ReactNode {
  const t = useAppTranslation(Translation.Ui.PaymentMethod);

  return <PaymentMethodDisplayShared {...props} slots={DESKTOP_SLOTS} getLabel={getLabel} t={t} />;
}
