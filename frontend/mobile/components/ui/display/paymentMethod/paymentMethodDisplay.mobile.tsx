"use client";

import type * as React from "react";
import {
  PaymentMethodDisplayShared,
  type PaymentMethodDisplaySharedOptions,
  type PaymentMethodDisplaySlots,
} from "@/frontend/common/components/ui/display/paymentMethod/PaymentMethodDisplayShared";
import type { PaymentMethodDisplayProps } from "@/frontend/common/components/ui/display/paymentMethod/types";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";
import { MobileCountryDisplay } from "@/frontend/mobile/components/ui/display/countryDisplay/countryDisplay.mobile";
import { MobileCurrencyDisplay } from "@/frontend/mobile/components/ui/display/currencyDisplay/CurrencyDisplay.mobile";
import { MobileLocalizedStringDisplay } from "@/frontend/mobile/components/ui/display/localizedStringDisplay/localizedStringDisplay.mobile";
import { MobilePhoneDisplay } from "@/frontend/mobile/components/ui/display/phoneDisplay/phoneDisplay.mobile";
import { Translation, useAppTranslation } from "@/shared/locale";

function getLabel(labels: object, key: string): string {
  if (!Object.hasOwn(labels, key)) {
    return "";
  }
  const value = Reflect.get(labels, key);
  return typeof value === "string" ? value : "";
}

const MOBILE_OPTIONS: PaymentMethodDisplaySharedOptions = {
  outerSpacing: [0.75, 1],
  headerGap: 0.75,
  detailSpacing: 0.5,
  labelTypography: "labelSm",
  labelMinWidth: 72,
  detailRowGap: 0.75,
  titleTypography: "titleLg",
};

const MOBILE_SLOTS: PaymentMethodDisplaySlots = {
  StatusBadge: MobileStatusBadge,
  CountryDisplay: MobileCountryDisplay,
  CurrencyDisplay: MobileCurrencyDisplay,
  LocalizedStringDisplay: MobileLocalizedStringDisplay,
  PhoneDisplay: MobilePhoneDisplay,
};

export function MobilePaymentMethodDisplay({ ...props }: Readonly<PaymentMethodDisplayProps>): React.ReactNode {
  const t = useAppTranslation(Translation.Ui.PaymentMethod);

  return (
    <PaymentMethodDisplayShared {...props} slots={MOBILE_SLOTS} options={MOBILE_OPTIONS} getLabel={getLabel} t={t} />
  );
}
