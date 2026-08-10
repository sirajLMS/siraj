"use client";

import type * as React from "react";
import type { FieldValues } from "react-hook-form";
import {
  PaymentMethodTypeFieldsShared,
  type PaymentMethodTypeFieldsSlots,
} from "@/frontend/common/components/ui/input/paymentMethodTypeFields/PaymentMethodTypeFieldsShared";
import type { PaymentMethodTypeFieldsProps } from "@/frontend/common/components/ui/input/paymentMethodTypeFields/types";
import { CountryAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/countrySelect";
import { CurrencySelectDesktop } from "@/frontend/desktop/components/ui/input/currencySelect";
import { LocalizedStringFormFieldDesktop } from "@/frontend/desktop/components/ui/input/localizedString";
import { PaymentMethodSelectDesktop } from "@/frontend/desktop/components/ui/input/paymentMethodSelect";
import { PhoneFormFieldDesktop } from "@/frontend/desktop/components/ui/input/phoneInput";
import { TagInputDesktop } from "@/frontend/desktop/components/ui/input/tagInput";
import { Translation, useAppTranslation } from "@/shared/locale";

const getDesktopSlots = <T extends FieldValues>(): PaymentMethodTypeFieldsSlots<T> => ({
  LocalizedStringFormField: LocalizedStringFormFieldDesktop,
  CountryAutocomplete: CountryAutocompleteDesktop,
  CurrencySelect: CurrencySelectDesktop,
  PaymentMethodSelect: PaymentMethodSelectDesktop,
  PhoneFormField: PhoneFormFieldDesktop,
  TagInput: TagInputDesktop,
});

export function PaymentMethodTypeFieldsDesktop<T extends FieldValues>({
  ...props
}: Readonly<PaymentMethodTypeFieldsProps<T>>): React.ReactNode {
  const t = useAppTranslation(Translation.Ui.PaymentMethod);

  return (
    <PaymentMethodTypeFieldsShared<T>
      {...props}
      slots={getDesktopSlots<T>()}
      options={{ stackSpacing: 2 }}
      tTypeFields={t.typeFields}
    />
  );
}
