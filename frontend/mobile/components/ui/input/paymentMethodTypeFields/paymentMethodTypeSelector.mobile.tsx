"use client";

import type * as React from "react";
import { PaymentMethodTypeSelectorShared } from "@/frontend/common/components/ui/input/paymentMethodTypeFields/PaymentMethodTypeSelectorShared";
import type { PaymentMethodTypeSelectorProps } from "@/frontend/common/components/ui/input/paymentMethodTypeFields/types";

const MOBILE_OPTIONS = { buttonSx: { minHeight: 40 } } as const;

export const PaymentMethodTypeSelectorMobile: React.FC<PaymentMethodTypeSelectorProps> = ({
  ...props
}): React.ReactNode => <PaymentMethodTypeSelectorShared {...props} options={MOBILE_OPTIONS} />;
