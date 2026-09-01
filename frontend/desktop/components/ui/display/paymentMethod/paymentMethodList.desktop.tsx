"use client";

import type * as React from "react";
import {
  PaymentMethodListShared,
  type PaymentMethodListSlots,
} from "@/frontend/common/components/ui/display/paymentMethod/PaymentMethodListShared";
import type { PaymentMethodRow } from "@/frontend/common/components/ui/display/paymentMethod/types";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid";
import { Translation, useAppTranslation } from "@/shared/locale";

export type DesktopPaymentMethodListProps = {
  readonly methods: readonly PaymentMethodRow[];
  readonly loading?: boolean;
  readonly title?: string;
  readonly emptyMessage?: string;
  readonly onEditAction?: (id: string) => void;
  readonly onDeleteAction?: (id: string) => void;
  readonly onSetDefaultAction?: (id: string) => void;
};

const DESKTOP_SLOTS: PaymentMethodListSlots = {
  StatusBadge: DesktopStatusBadge,
  DataGrid: DesktopAppDataGrid,
};

export function DesktopPaymentMethodList(props: Readonly<DesktopPaymentMethodListProps>): React.ReactNode {
  const t = useAppTranslation(Translation.Ui.PaymentMethod);

  return <PaymentMethodListShared {...props} slots={DESKTOP_SLOTS} t={t} />;
}
