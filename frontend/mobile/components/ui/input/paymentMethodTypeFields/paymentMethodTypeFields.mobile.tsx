"use client";

import type * as React from "react";
import type { FieldValues } from "react-hook-form";
import {
  PaymentMethodTypeFieldsShared,
  type PaymentMethodTypeFieldsSlots,
} from "@/frontend/common/components/ui/input/paymentMethodTypeFields/PaymentMethodTypeFieldsShared";
import type { PaymentMethodTypeFieldsProps } from "@/frontend/common/components/ui/input/paymentMethodTypeFields/types";
import { CountryAutocompleteMobile } from "@/frontend/mobile/components/ui/input/countrySelect";
import { CurrencySelectMobile } from "@/frontend/mobile/components/ui/input/currencySelect";
import { LocalizedStringFormFieldMobile } from "@/frontend/mobile/components/ui/input/localizedString";
import { PaymentMethodSelectMobile } from "@/frontend/mobile/components/ui/input/paymentMethodSelect";
import { PhoneFormFieldMobile } from "@/frontend/mobile/components/ui/input/phoneInput";
import { TagInputMobile } from "@/frontend/mobile/components/ui/input/tagInput";
import { Translation, useAppTranslation } from "@/shared/locale";

const getMobileSlots = <T extends FieldValues>(): PaymentMethodTypeFieldsSlots<T> => ({
  LocalizedStringFormField: LocalizedStringFormFieldMobile,
  CountryAutocomplete: CountryAutocompleteMobile,
  CurrencySelect: CurrencySelectMobile,
  PaymentMethodSelect: PaymentMethodSelectMobile,
  PhoneFormField: PhoneFormFieldMobile,
  TagInput: TagInputMobile,
});

export function PaymentMethodTypeFieldsMobile<T extends FieldValues>({
  ...props
}: Readonly<PaymentMethodTypeFieldsProps<T>>): React.ReactNode {
  const t = useAppTranslation(Translation.Ui.PaymentMethod);

  return (
    <PaymentMethodTypeFieldsShared<T>
      {...props}
      slots={getMobileSlots<T>()}
      options={{ stackSpacing: 2, textFieldSize: "small" }}
      tTypeFields={t.typeFields}
    />
  );
}
