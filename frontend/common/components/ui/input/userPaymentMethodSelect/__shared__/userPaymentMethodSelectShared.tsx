"use client";

import type * as React from "react";
import type { UserPaymentMethodAutocompleteProps } from "@/frontend/common/components/ui/input/userPaymentMethodSelect/UserPaymentMethodAutocompleteShared";
import type { UserPaymentMethodFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";

type UserPaymentMethodBaseProps = Omit<UserPaymentMethodAutocompleteProps, "onChangeAction">;

export type UserPaymentMethodSelectProps = UserPaymentMethodBaseProps & {
  readonly setValueAction: (method: UserPaymentMethodFieldsFragment) => void;
};

export type UserPaymentMethodSelectSlotProps = {
  readonly AutocompleteComponent: React.ComponentType<UserPaymentMethodAutocompleteProps>;
};

export function UserPaymentMethodSelectShared({
  value,
  setValueAction,
  options,
  AutocompleteComponent,
  ...props
}: Readonly<UserPaymentMethodSelectProps & UserPaymentMethodSelectSlotProps>): React.ReactNode {
  const autocompleteProps: UserPaymentMethodAutocompleteProps = {
    value,
    options,
    onChangeAction: setValueAction,
    ...props,
  };

  return <AutocompleteComponent {...autocompleteProps} />;
}
