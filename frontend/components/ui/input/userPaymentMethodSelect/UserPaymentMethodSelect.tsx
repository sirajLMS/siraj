"use client";

import type * as React from "react";
import {
  UserPaymentMethodAutocomplete,
  type UserPaymentMethodAutocompleteProps,
} from "@/frontend/components/ui/input/userPaymentMethodSelect/UserPaymentMethodAutocomplete";
import type { UserPaymentMethodFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";

export type UserPaymentMethodSelectProps = {
  readonly value?: UserPaymentMethodFieldsFragment | null;
  readonly options: readonly UserPaymentMethodFieldsFragment[];
  readonly setValueAction: (method: UserPaymentMethodFieldsFragment) => void;
  readonly autoComplete?: string;
  readonly fullWidth?: boolean;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly placeholder?: string;
  readonly error?: boolean;
  readonly helperText?: string;
  readonly onBlurAction?: () => void;
  readonly style?: React.CSSProperties;
};

export function UserPaymentMethodSelect({
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

  return <UserPaymentMethodAutocomplete {...autocompleteProps} />;
}
