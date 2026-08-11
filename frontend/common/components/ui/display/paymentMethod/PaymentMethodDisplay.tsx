"use client";

import type * as React from "react";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { CountryDisplay } from "@/frontend/common/components/ui/display/countryDisplay/CountryDisplay";
import { CurrencyDisplay } from "@/frontend/common/components/ui/display/currencyDisplay/CurrencyDisplay";
import { LocalizedStringDisplay } from "@/frontend/common/components/ui/display/localizedStringDisplay/LocalizedStringDisplay";
import {
  PaymentMethodDisplayShared,
  type PaymentMethodDisplaySlots,
} from "@/frontend/common/components/ui/display/paymentMethod/PaymentMethodDisplayShared";
import type { PaymentMethodDisplayProps } from "@/frontend/common/components/ui/display/paymentMethod/types";
import { PhoneDisplay } from "@/frontend/common/components/ui/display/phoneDisplay/PhoneDisplay";
import { Translation, useAppTranslation } from "@/shared/locale";

function isKeyOf<T extends object>(value: string | number | symbol, obj: T): value is keyof T {
  return value in obj;
}

function getLabel(labels: object, key: string): string {
  return isKeyOf(key, labels) ? labels[key] : "";
}

const COMMON_SLOTS: PaymentMethodDisplaySlots = {
  StatusBadge,
  CountryDisplay,
  CurrencyDisplay,
  LocalizedStringDisplay,
  PhoneDisplay,
};

export function PaymentMethodDisplay({ ...props }: Readonly<PaymentMethodDisplayProps>): React.ReactNode {
  const t = useAppTranslation(Translation.Ui.PaymentMethod);

  return <PaymentMethodDisplayShared {...props} slots={COMMON_SLOTS} getLabel={getLabel} t={t} />;
}
