"use client";

import type * as React from "react";
import {
  type UserPaymentMethodSelectProps,
  UserPaymentMethodSelectShared,
} from "@/frontend/common/components/ui/input/userPaymentMethodSelect/__shared__/userPaymentMethodSelectShared";
import { UserPaymentMethodAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userPaymentMethodSelect/userPaymentMethodAutocomplete.mobile";

export type {
  UserPaymentMethodAutocompleteProps,
  UserPaymentMethodSelectProps,
} from "@/frontend/common/components/ui/input/userPaymentMethodSelect/__shared__/userPaymentMethodSelectShared";

export function UserPaymentMethodSelectMobile(props: Readonly<UserPaymentMethodSelectProps>): React.ReactNode {
  return <UserPaymentMethodSelectShared {...props} AutocompleteComponent={UserPaymentMethodAutocompleteMobile} />;
}
