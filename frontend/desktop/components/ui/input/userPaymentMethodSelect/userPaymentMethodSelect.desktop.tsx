"use client";

import type * as React from "react";
import type { UserPaymentMethodFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import { UserPaymentMethodAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userPaymentMethodSelect/userPaymentMethodAutocomplete.desktop";

export type PaymentMethodLabels = {
  readonly type: {
    readonly mobileWallet: string;
    readonly paymentLink: string;
    readonly onlineAccount: string;
    readonly bankTransfer: string;
    readonly cash: string;
    readonly proofUpload: string;
  };
  readonly direction: {
    readonly in: string;
    readonly out: string;
    readonly both: string;
  };
  readonly identifier: {
    readonly email: string;
    readonly handle: string;
    readonly emailOrHandle: string;
  };
  readonly select: {
    readonly selectMethod: string;
    readonly searchByNameOrSlug: string;
    readonly required: string;
  };
  readonly display: {
    readonly defaultBadge: string;
  };
};

export type UserPaymentMethodAutocompleteProps = {
  readonly value?: UserPaymentMethodFieldsFragment | null;
  readonly options: readonly UserPaymentMethodFieldsFragment[];
  readonly onChangeAction: (method: UserPaymentMethodFieldsFragment) => void;
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
