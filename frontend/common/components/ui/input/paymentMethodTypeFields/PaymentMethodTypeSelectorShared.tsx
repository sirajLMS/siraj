"use client";

import type * as React from "react";
import { ButtonGroupSelectorShared } from "@/frontend/common/components/ui/input/genderSelector/ButtonGroupSelectorShared";
import type {
  ButtonGroupSelectorButton,
  ButtonGroupSelectorOptions,
} from "@/frontend/common/components/ui/input/genderSelector/buttonGroupSelectorTypes";
import { buildPaymentMethodTypeLabelByType } from "@/frontend/common/components/ui/input/paymentMethodTypeFields/constants";
import type { PaymentMethodTypeSelectorProps } from "@/frontend/common/components/ui/input/paymentMethodTypeFields/types";
import { PAYMENT_METHOD_TYPES } from "@/frontend/common/lib/payment-method";
import { Translation, useAppTranslation } from "@/shared/locale";

export type PaymentMethodTypeSelectorSharedOptions = {
  readonly buttonSx?: React.CSSProperties;
};

const DEFAULT_OPTIONS: PaymentMethodTypeSelectorSharedOptions = {};

export function PaymentMethodTypeSelectorShared({
  type,
  setTypeAction,
  error = false,
  required = false,
  fullWidth = false,
  labels,
  allowEmpty = false,
  allowedTypes,
  options = DEFAULT_OPTIONS,
}: Readonly<PaymentMethodTypeSelectorProps> & {
  readonly options?: PaymentMethodTypeSelectorSharedOptions;
}): React.ReactNode {
  const t = useAppTranslation(Translation.Ui.PaymentMethod).typeSelector;
  const title = labels?.title ?? t.title;
  const ariaLabel = labels?.ariaLabel ?? t.ariaLabel;
  const anyLabel = labels?.any ?? t.any;

  const labelByType = buildPaymentMethodTypeLabelByType(labels, t);

  const visibleTypes = allowedTypes ?? PAYMENT_METHOD_TYPES;
  const buttons: ReadonlyArray<ButtonGroupSelectorButton<typeof type>> = visibleTypes.map(value => ({
    value,
    label: labelByType[value],
  }));

  const sharedOptions: ButtonGroupSelectorOptions = {
    buttonGroupWidth: "70%",
    buttonGroupFlexWrap: "wrap",
    useFlexButton: true,
    ...(options.buttonSx !== undefined ? { buttonSx: options.buttonSx } : {}),
  };

  return (
    <ButtonGroupSelectorShared<typeof type>
      selectedValue={type}
      onSelect={setTypeAction}
      buttons={buttons}
      title={title}
      ariaLabel={ariaLabel}
      anyLabel={anyLabel}
      error={error}
      required={required}
      fullWidth={fullWidth}
      allowEmpty={allowEmpty}
      options={sharedOptions}
    />
  );
}
