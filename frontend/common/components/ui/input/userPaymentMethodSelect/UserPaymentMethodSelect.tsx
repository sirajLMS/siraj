"use client";

import type * as React from "react";
import {
  type UserPaymentMethodSelectProps,
  UserPaymentMethodSelectShared,
} from "@/frontend/common/components/ui/input/userPaymentMethodSelect/__shared__/userPaymentMethodSelectShared";
import { UserPaymentMethodAutocomplete } from "@/frontend/common/components/ui/input/userPaymentMethodSelect/UserPaymentMethodAutocomplete";

export type { UserPaymentMethodSelectProps };

export function UserPaymentMethodSelect(props: Readonly<UserPaymentMethodSelectProps>): React.ReactNode {
  return <UserPaymentMethodSelectShared {...props} AutocompleteComponent={UserPaymentMethodAutocomplete} />;
}
