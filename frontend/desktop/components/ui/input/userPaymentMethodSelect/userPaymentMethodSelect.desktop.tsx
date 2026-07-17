"use client";

import type * as React from "react";
import type { UserPaymentMethodAutocompleteProps } from "@/frontend/common/components/ui/input/userPaymentMethodSelect/UserPaymentMethodAutocomplete";
import type { UserPaymentMethodSelectProps } from "@/frontend/common/components/ui/input/userPaymentMethodSelect/UserPaymentMethodSelect";
import { UserPaymentMethodAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userPaymentMethodSelect/userPaymentMethodAutocomplete.desktop";

export function UserPaymentMethodSelectDesktop({
  value,
  setValueAction,
  options,
  ...props
}: UserPaymentMethodSelectProps): React.ReactNode {
  const autocompleteProps: UserPaymentMethodAutocompleteProps = {
    value,
    options,
    onChangeAction: setValueAction,
    ...props,
  };

  return <UserPaymentMethodAutocompleteDesktop {...autocompleteProps} />;
}
