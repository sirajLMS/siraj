"use client";

import type * as React from "react";
import { PaymentMethodTypeSelectorShared } from "@/frontend/common/components/ui/input/paymentMethodTypeFields/PaymentMethodTypeSelectorShared";
import type { PaymentMethodTypeSelectorProps } from "@/frontend/common/components/ui/input/paymentMethodTypeFields/types";

export const PaymentMethodTypeSelector: React.FC<PaymentMethodTypeSelectorProps> = ({ ...props }): React.ReactNode => (
  <PaymentMethodTypeSelectorShared {...props} />
);
