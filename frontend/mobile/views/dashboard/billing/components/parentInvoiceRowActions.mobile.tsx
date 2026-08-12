"use client";

import { ParentInvoiceRowActionsShared } from "@/frontend/common/views/dashboard/billing/components/__shared__/parentInvoiceRowActionsShared";
import type { ParentInvoiceRowActionsProps } from "@/frontend/common/views/dashboard/billing/types/parentInvoiceList.types";
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button";

export function ParentInvoiceRowActionsMobile(props: Readonly<ParentInvoiceRowActionsProps>): React.ReactNode {
  return ParentInvoiceRowActionsShared(props, {
    PrimaryAction: MobilePrimaryPageAction,
    paymentPendingSize: "medium",
    paymentPendingFullWidth: true,
    paymentPendingWrapInBox: false,
    unpaidLayout: "column",
    unpaidViewFeedbackSize: undefined,
    unpaidViewFeedbackFullWidth: true,
    unpaidPrimarySize: undefined,
    unpaidPrimaryFullWidth: true,
  });
}
