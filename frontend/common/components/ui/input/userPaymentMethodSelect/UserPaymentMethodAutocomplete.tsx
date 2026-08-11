"use client";

import type * as React from "react";
import {
  type UserPaymentMethodAutocompleteProps,
  UserPaymentMethodAutocompleteShared,
} from "@/frontend/common/components/ui/input/userPaymentMethodSelect/UserPaymentMethodAutocompleteShared";

export type { UserPaymentMethodAutocompleteProps };

export function UserPaymentMethodAutocomplete(props: Readonly<UserPaymentMethodAutocompleteProps>): React.ReactNode {
  return <UserPaymentMethodAutocompleteShared {...props} />;
}
