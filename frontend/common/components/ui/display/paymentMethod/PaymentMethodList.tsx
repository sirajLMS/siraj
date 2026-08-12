"use client";

import type * as React from "react";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import {
  PaymentMethodListShared,
  type PaymentMethodListSharedProps,
  type PaymentMethodListSlots,
} from "@/frontend/common/components/ui/display/paymentMethod/PaymentMethodListShared";
import { Translation, useAppTranslation } from "@/shared/locale";

export type PaymentMethodListProps = Omit<PaymentMethodListSharedProps, "slots" | "t">;

const COMMON_SLOTS: PaymentMethodListSlots = {
  StatusBadge,
  DataGrid: AppDataGrid,
};

export function PaymentMethodList(props: Readonly<PaymentMethodListProps>): React.ReactNode {
  const t = useAppTranslation(Translation.Ui.PaymentMethod);

  return <PaymentMethodListShared {...props} slots={COMMON_SLOTS} t={t} />;
}
