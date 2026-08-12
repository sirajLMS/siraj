"use client";

import type * as React from "react";
import {
  type UserPaymentMethodSelectProps,
  UserPaymentMethodSelectShared,
} from "@/frontend/common/components/ui/input/userPaymentMethodSelect/__shared__/userPaymentMethodSelectShared";
import { UserPaymentMethodAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userPaymentMethodSelect/userPaymentMethodAutocomplete.desktop";

export type {
  PaymentMethodLabels,
  UserPaymentMethodAutocompleteProps,
  UserPaymentMethodSelectProps,
} from "@/frontend/common/components/ui/input/userPaymentMethodSelect/__shared__/userPaymentMethodSelectShared";

export function UserPaymentMethodSelectDesktop(props: Readonly<UserPaymentMethodSelectProps>): React.ReactNode {
  return <UserPaymentMethodSelectShared {...props} AutocompleteComponent={UserPaymentMethodAutocompleteDesktop} />;
}
