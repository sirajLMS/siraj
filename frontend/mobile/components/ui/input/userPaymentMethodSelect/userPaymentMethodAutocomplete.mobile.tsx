"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import type * as React from "react";
import {
  type UserPaymentMethodAutocompleteProps,
  UserPaymentMethodAutocompleteShared,
} from "@/frontend/common/components/ui/input/userPaymentMethodSelect/UserPaymentMethodAutocompleteShared";

export type { UserPaymentMethodAutocompleteProps };

const MOBILE_OPTION_SX: SxProps<Theme> = { px: 1.5, py: 1.25, minHeight: 48 };

export function UserPaymentMethodAutocompleteMobile(
  props: Readonly<UserPaymentMethodAutocompleteProps>
): React.ReactNode {
  return <UserPaymentMethodAutocompleteShared {...props} optionSx={MOBILE_OPTION_SX} />;
}
