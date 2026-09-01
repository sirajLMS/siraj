"use client";

import type * as React from "react";
import type { FieldValues } from "react-hook-form";
import { CountryAutocomplete } from "@/frontend/common/components/ui/input/countrySelect/CountryAutocomplete";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect/CurrencySelect";
import { LocalizedStringFormField } from "@/frontend/common/components/ui/input/localizedString/LocalizedStringFormField";
import { PaymentMethodSelect } from "@/frontend/common/components/ui/input/paymentMethodSelect/PaymentMethodSelect";
import {
  PaymentMethodTypeFieldsShared,
  type PaymentMethodTypeFieldsSlots,
} from "@/frontend/common/components/ui/input/paymentMethodTypeFields/PaymentMethodTypeFieldsShared";
import type { PaymentMethodTypeFieldsProps } from "@/frontend/common/components/ui/input/paymentMethodTypeFields/types";
import { PhoneFormField } from "@/frontend/common/components/ui/input/phoneInput/PhoneFormField";
import { TagInput } from "@/frontend/common/components/ui/input/tagInput/TagInput";
import { Translation, useAppTranslation } from "@/shared/locale";

export type { PaymentMethodTypeFieldsProps } from "@/frontend/common/components/ui/input/paymentMethodTypeFields/types";

const getSharedSlots = <T extends FieldValues>(): PaymentMethodTypeFieldsSlots<T> => ({
  LocalizedStringFormField,
  CountryAutocomplete,
  CurrencySelect,
  PaymentMethodSelect,
  PhoneFormField,
  TagInput,
});

export function PaymentMethodTypeFields<T extends FieldValues>({
  ...props
}: Readonly<PaymentMethodTypeFieldsProps<T>>): React.ReactNode {
  const t = useAppTranslation(Translation.Ui.PaymentMethod);

  return (
    <PaymentMethodTypeFieldsShared<T>
      {...props}
      slots={getSharedSlots<T>()}
      options={{ stackSpacing: 2 }}
      tTypeFields={t.typeFields}
    />
  );
}
